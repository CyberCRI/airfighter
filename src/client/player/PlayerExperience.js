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

const STARTING_HEALTH = 2;


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
    this.currentLabel = null;

    this.vibrator = new Vibrator();

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
            if (that.moved == false)
            {
              that.moved = true;
              if(that.activePeriod) 
              {
                that.send("moved", hhmmResults.likeliest, currentTimeProgression);
              }
              else
              {
                that.send("failed", hhmmResults.likeliest, currentTimeProgression); 
                that.srcSoundStun = audioContext.createBufferSource();
                that.srcSoundStun.loop = true;
                that.srcSoundStun.buffer = that.loader.buffers[5];
                that.srcSoundStun.connect(audioContext.destination);
                that.srcSoundStun.start(audioContext.currentTime);
                that.nextStun = true;
                that.vibrator.brouuum();
              }

              if(hhmmResults.likeliest == "Punch") {
                const src = audioContext.createBufferSource();
                src.buffer = that.loader.buffers[1];
                src.connect(audioContext.destination);
                src.start(audioContext.currentTime);
                that.vibrator.brouum();
              } else if(hhmmResults.likeliest == "Block") {
                const src = audioContext.createBufferSource();
                src.buffer = that.loader.buffers[2];
                src.connect(audioContext.destination);
                src.start(audioContext.currentTime);
                that.vibrator.brouum();
              }
              else if(hhmmResults.likeliest == "Uppercut") {
                const src = audioContext.createBufferSource();
                src.buffer = that.loader.buffers[3];
                src.connect(audioContext.destination);
                src.start(audioContext.currentTime);
                that.vibrator.brouum();
              }
              else if(hhmmResults.likeliest == "SuperUppercut") {
                const src = audioContext.createBufferSource();
                src.buffer = that.loader.buffers[4];
                src.connect(audioContext.destination);
                src.start(audioContext.currentTime);
                that.vibrator.brouuum();
              }

              that.lastLabel = null;
              that.lastTimeProgression = null;
              that.currentLabel = hhmmResults.likeliest;
              hhmmDecoder.reset();
            }
          } else {
            that.currentLabel = null;
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

    const playSound = (index) =>
    {
      const src = audioContext.createBufferSource();
      src.buffer = this.loader.buffers[index];
      src.connect(audioContext.destination);
      src.start(audioContext.currentTime);
    }

    const soundHealth = () =>
    {
      if (this.health == 4)
        playSound(8);
      else if (this.health == 3)
        playSound(9);
      else if (this.health == 2)
        playSound(10);
      else if (this.health == 1)
        playSound(11);
      else if (this.health <= 0)
      {
        playSound(12);
        this.moved = true;
        this.send("end");
      }
    }

    super.start(); // don't forget this
    this.health = STARTING_HEALTH;
    this.activePeriod = false;
    this.moved = true;
    this.nextStun = false;
    this.srcSoundStun = null;

    if (!this.hasStarted)
      this.init();

    this.show();

    // play the first loaded buffer immediately
    const src = audioContext.createBufferSource();
    src.buffer = this.loader.buffers[0];
    src.connect(audioContext.destination);
    src.start(audioContext.currentTime);
    this.vibrator.broum();

    // play the second loaded buffer when the message `play` is received from
    // the server, the message is send when another player joins the experience.
    this.receive('go', (turnStartedTime) => {
      this.myTurn = true;
      this.turnStartedTime = turnStartedTime;

      this.view.content.title = `Your turn`;
      this.view.render();
    });

    this.receive('move', (label) => {
        if (label == 'SuperUppercut')
        {
          if (this.currentLabel != 'SuperUppercut')
          {
            playSound(7);
            this.health -= 2;
          }
          else
          {
            playSound(6);
          }
        }
        else if (label == 'Uppercut')
        {
          if (this.currentLabel == 'Uppercut')
          {
            playSound(6);
          }
          else if (this.currentLabel == 'Punch')
          {
            //nothing
          }
          else
          {
            playSound(7);
            this.health -= 1;
          }
        }
        else if (label == 'Punch')
        {
          if (this.currentLabel == 'Punch' || this.currentLabel == 'Block')
          {
            playSound(6);
          }
          else
          {
            playSound(7)
            this.health -= 1;
            soundHealth();
          }
        }
    });

    this.receive('ding', () => {
      if (this.nextStun == false)
      {
        this.activePeriod = true;
        this.moved = false;
        if (this.srcSoundStun)
          this.srcSoundStun.stop();
      }
      else
        this.nextStun = false;
      // This is ugly -> wait 4 beats = 2 s
      setTimeout(() => { this.activePeriod = false; }, 2000);
    });

    this.receive('startRound', () => {
      this.health = STARTING_HEALTH;
      this.moved = false;
    });

    this.receive('win', () => {
      this.moved = true;
      playSound(13);
    });

    this.receive('otherMoved', (label) => {
      this.view.content.title = "Other: " + label;
      this.view.render();
    });
  }
}

class Vibrator {
  constructor() {
    this.navigator = window.navigator;
  }

  broum() {
    if (this.vibrator)
      this.vibrator.vibrate(500);
  }

  brouum() {
    if (this.vibrator)
      this.vibrator.vibrate(1000);
  }

  brouuum() {
    if (this.vibrator)
      this.vibrator.vibrate(2000);
  } 

  stop() {
    if (this.vibrator)
      this.vibrator.vibrate(0);
  } 
};
