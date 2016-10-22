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
  constructor(sync, period, sendFunction) {
    super();

    this.sync = sync;
    this.period = period // eight note duration
    this.sendFunction = sendFunction;
  }

  advanceTime(time) {
    const nextEventNbrPeriod = Math.floor(Math.random() * 8 + 4);
    console.log("scheduled ding for", nextEventNbrPeriod, "periods");
    //const nextEventNbrPeriod = 1;
    const period = nextEventNbrPeriod * this.period;
    const nextTime = time + period;
    
    const nextSyncTime = this.sync.getAudioTime(nextTime);
    this.sendFunction(nextSyncTime);

    return nextTime;
  }
}

// this.scheduler

// this experience plays a sound when it starts, and plays another sound when
// other clients join the experience
export default class ControllerExperience extends soundworks.Experience {
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

    if (!this.hasStarted)
      this.init();

    this.show();

    var hasStartedMusic = false;

    this.synth = new Synth(this.sync, 0.5, (nextTime) => { 
      if(hasStartedMusic) {
        // use time to play a sound at time
        const src = audioContext.createBufferSource();
        src.buffer = this.loader.buffers[1];
        src.connect(audioContext.destination);
        src.start(nextTime);

        this.send("ding");        
      } else {
        // play music
        const src = audioContext.createBufferSource();
        src.loop = true;
        src.buffer = this.loader.buffers[2];
        src.connect(audioContext.destination);
        src.start(nextTime);

        hasStartedMusic = true;
      }
    });

    this.scheduler.add(this.synth);

    // play the first loaded buffer immediately
    const src = audioContext.createBufferSource();
    src.buffer = this.loader.buffers[0];
    src.connect(audioContext.destination);
    src.start(audioContext.currentTime);

    console
  }
}
