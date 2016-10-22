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

const audio = soundworks.audio;

// player
// this.receive('next-event', (nextSyncTime) => {
//   this.scheduler.defer(nextSynthTime, () => {});
// });

// this experience plays a sound when it starts, and plays another sound when
// other clients join the experience
export default class PlayerExperience extends soundworks.Experience {
  constructor(assetsDomain, audioFiles) {
    super();

    this.platform = this.require('platform', { features: ['web-audio', 'wake-lock'] });
    this.checkin = this.require('checkin', { showDialog: false });
    this.sync = this.require('sync');
    this.scheduler = this.require('scheduler');
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

          //that.send("debugLikelihoods", hhmmResults.likelihoods); 

          var currentTimeProgression = hhmmResults.timeProgressions[hhmmResults.likeliestIndex];
          // that.send("debugMotion", hhmmResults.likeliest, currentTimeProgression);

          if(that.lastLabel
            && hhmmResults.likeliest == that.lastLabel 
            && that.lastTimeProgression <= 0.6 
            && currentTimeProgression > 0.6)
          {
            if(that.activePeriod) 
            {
              that.send("moved", hhmmResults.likeliest, currentTimeProgression);
            }
            else 
            {
              that.send("failed", hhmmResults.likeliest, currentTimeProgression); 
              const src = audioContext.createBufferSource();
              src.buffer = that.loader.buffers[5];
              src.connect(audioContext.destination);
              src.start(audioContext.currentTime);
            }

            if(hhmmResults.likeliest == "Punch") {
              const src = audioContext.createBufferSource();
              src.buffer = that.loader.buffers[1];
              src.connect(audioContext.destination);
              src.start(audioContext.currentTime);
            } else if(hhmmResults.likeliest == "Block") {
              const src = audioContext.createBufferSource();
              src.buffer = that.loader.buffers[2];
              src.connect(audioContext.destination);
              src.start(audioContext.currentTime);
            }
            else if(hhmmResults.likeliest == "Uppercut") {
              const src = audioContext.createBufferSource();
              src.buffer = that.loader.buffers[3];
              src.connect(audioContext.destination);
              src.start(audioContext.currentTime);
            }
            else if(hhmmResults.likeliest == "SuperUppercut") {
              const src = audioContext.createBufferSource();
              src.buffer = that.loader.buffers[4];
              src.connect(audioContext.destination);
              src.start(audioContext.currentTime);
            }


            that.lastLabel = null;
            that.lastTimeProgression = null;

            hhmmDecoder.reset();

          } else {
            that.lastLabel = hhmmResults.likeliest;
            that.lastTimeProgression = currentTimeProgression;
          }
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

    this.activePeriod = false;

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

    this.receive('ding', () => {
      this.activePeriod = true;
      // This is ugly -> wait 4 beats = 2 s
      setTimeout(() => { this.activePeriod = false; }, 2000);
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
}
