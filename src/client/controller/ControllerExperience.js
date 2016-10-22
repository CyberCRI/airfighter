import * as soundworks from 'soundworks/client';

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

class Synth extends audio.TimeEngine {
  constructor(period, sendFunction) {
    super();

    this.period = period // eight note duration
    this.sendFunction = sendFunction;
  }

  advanceTime(time) {
    // use time to play a sound at time
    const src = audioContext.createOscillator();
    src.connect(audioContext.destination);
    src.start(time);

    const nextEventNbrPeriod = Math.floor(Math.random() * 10 + 4);
    const period = nextEventNbrPeriod * this.period;
    const nextTime = time + period;
    
    // 
    const nextSyncTime = convertToSyncTime(nextTime);
    this.sendFunction('next-event', nextSyncTime);

    return nextTime;
  }
}

// this.scheduler

// this experience plays a sound when it starts, and plays another sound when
// other clients join the experience
export default class ControllerExperience extends soundworks.Experience {
  constructor(assetsDomain, audioFiles) {
    super();

    console.log('test');
    this.platform = this.require('platform', { features: ['web-audio', 'wake-lock'] });
    this.checkin = this.require('checkin', { showDialog: false });
    this.sync = this.require('sync');
    this.scheduler = this.require('scheduler');
    this.loader = this.require('loader', {
      assetsDomain: assetsDomain,
      files: audioFiles,
    });

    this.lastLabel = null;
    this.lastTimeProgression = null;
  }

  init() {
    // initialize the view
    this.viewTemplate = viewTemplate;
    this.viewContent = { title: `Controller` };
    this.viewCtor = soundworks.CanvasView;
    this.viewOptions = { preservePixelRatio: true };
    this.view = this.createView();
  }

  start() {
    super.start(); // don't forget this

    console.log('test');
    if (!this.hasStarted)
      this.init();

    this.show();

    // play the first loaded buffer immediately
    const src = audioContext.createBufferSource();
    src.buffer = this.loader.buffers[0];
    src.connect(audioContext.destination);
    src.start(audioContext.currentTime);
  }
}
