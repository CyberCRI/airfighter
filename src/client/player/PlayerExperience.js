import * as soundworks from 'soundworks/client';
import PlayerRenderer from './PlayerRenderer';

import hhmmModel from './model.json';
// var hhmmModel = require('./model.json');

//import HhmmDecoder from 'xmm-client/src';
//const hhmmDecoder = new HhmmDecoder();

var xmmClient = require('xmm-client');

const hhmmDecoder = new xmmClient.HhmmDecoder();
hhmmDecoder.model = hhmmModel;

const audioContext = soundworks.audioContext;

const viewTemplate = `
  <canvas class="background"></canvas>
  <div class="foreground">
    <div class="section-top flex-middle"></div>
    <div class="section-center flex-center">
      <p class="big"><%= title %></p>
    </div>
    <div class="section-bottom flex-middle"></div>
  </div>
`;

// this experience plays a sound when it starts, and plays another sound when
// other clients join the experience
export default class PlayerExperience extends soundworks.Experience {
  constructor(assetsDomain, audioFiles) {
    super();

    this.platform = this.require('platform', { features: ['web-audio', 'wake-lock'] });
    this.checkin = this.require('checkin', { showDialog: false });
    this.sync = this.require('sync');
    this.loader = this.require('loader', {
      assetsDomain: assetsDomain,
      files: audioFiles,
    });

    // this.motionInput = this.require("motion-input", {
    //   descriptors: ["rotationRate"]
    // });

    this.lastLabel = null;
    this.lastTimeProgression = null;

    var that = this;
    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', function(e) {
        var sextet = [
          e.acceleration.x, e.acceleration.y, e.acceleration.z,
          e.rotationRate.alpha, e.rotationRate.beta, e.rotationRate.gamma
        ];

        console.log("DeviceMotionEvent", e);

        // in adition to gesture following control of the granular player's position,
        // the granular player's volume is controlled by gesture intensity
        // features.setAccelerometer(sextet[0], sextet[1], sextet[2]);
        // features.setGyroscope(sextet[3], sextet[4], sextet[5]);
        // features.update(function(err, res) {
        //   volume.gain.value = Math.min(res.accIntensity.norm * 0.1, 1);
        // });

        if(that.view) {
          that.view.content.title = "Moved " + sextet[0];
          that.view.render();
        }

        hhmmDecoder.filter(sextet, function(err, hhmmResults) {
          if(err) { 
            console.log("can't filter movement", err); 
            return;
          }

          var currentTimeProgression = hhmmResults.timeProgressions[hhmmResults.likeliestIndex];
          that.send("debugMotion", hhmmResults.likeliest, currentTimeProgression);

          if(hhmmResults.likeliest == that.lastLabel 
            && that.lastTimeProgression <= 0.65 
            && currentTimeProgression >= 0.6)
          {
            that.send("moved", hhmmResults.likeliest, currentTimeProgression);
          }

          that.lastLabel = hhmmResults.likeliest;
          that.lastTimeProgression = currentTimeProgression;
        });
      });
    }

    this.turnStarted = 0;
    this.myTurn = false;
    this.points = 0;
  }

  init() {
    // initialize the view
    this.viewTemplate = viewTemplate;
    this.viewContent = { title: `Wait...` };
    this.viewCtor = soundworks.CanvasView;
    this.viewOptions = { preservePixelRatio: true };
    this.view = this.createView();
  }

  start() {
    super.start(); // don't forget this

    if (!this.hasStarted)
      this.init();

    this.show();

    // play the first loaded buffer immediately
    const src = audioContext.createBufferSource();
    src.buffer = this.loader.buffers[0];
    src.connect(audioContext.destination);
    src.start(audioContext.currentTime);

    // play the second loaded buffer when the message `play` is received from
    // the server, the message is send when another player joins the experience.
    this.receive('go', (turnStartedTime) => {
      this.myTurn = true;
      this.turnStartedTime = turnStartedTime;

      this.view.content.title = `Your turn`;
      this.view.render();
    });

    this.receive('otherMoved', (label) => {
      this.view.content.title = "Other: " + label;
      this.view.render();
    });

    // initialize rendering
    this.renderer = new PlayerRenderer(100, 100);
    this.view.addRenderer(this.renderer);

    // this function is called before each update (`Renderer.render`) of the canvas
    this.view.setPreRender(function(ctx, dt) {
      ctx.save();
      ctx.globalAlpha = 0.05;
      ctx.fillStyle = '#000000';
      ctx.rect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.fill();
      ctx.restore();
    });
  }

    /*if(!this.myTurn) return;

    const currentTime = this.sync.getSyncTime();

    const gyroX = data[0];
    const gyroY = data[1];
    const gyroZ = data[2];

    const mag = Math.sqrt(gyroX * gyroX + gyroY * gyroY + gyroZ + gyroZ);
    if(mag > 50) {
      let turnTime;
      if(!this.turnStartedTime) turnTime = 1;
      else turnTime = currentTime - this.turnStartedTime;
      
      if(turnTime < 0.8 || turnTime > 1.2) {
        // play quack
        // MISSED
        const src = audioContext.createBufferSource();
        src.buffer = this.loader.buffers[2];
        src.connect(audioContext.destination);

        if(turnTime > 1)
          src.playbackRate.value = 0.7;

        src.start(audioContext.currentTime);

        this.view.content.title = `Missed<br>${this.points} points`;
        this.view.render();

        this.send("missed");
        this.points = 0;
      }
      else 
      {
         // play hit sound
        const src = audioContext.createBufferSource();
        src.buffer = this.loader.buffers[0];
        src.connect(audioContext.destination);
        src.start(audioContext.currentTime);       

        this.view.content.title = `Hit<br>${this.points} points`;
        this.view.render();

        this.send("hit", mag, currentTime);

        this.points += 15;
      }

      this.myTurn = false;
    } */
  //}
}
