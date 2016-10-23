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
  constructor(sync, period, countPeriodsFunction, sendFunction) {
    super();

    this.sync = sync;
    this.period = period // eight note duration
    this.countPeriodsFunction = countPeriodsFunction;
    this.sendFunction = sendFunction;
  }

  advanceTime(time) {
    const nextEventNbrPeriod = this.countPeriodsFunction();
    const period = nextEventNbrPeriod * this.period;
    const nextTime = time + period;
    
    this.sendFunction(this.sync.getAudioTime(time), this.sync.getAudioTime(time, nextTime));

    return nextTime;
  }
}


// this experience plays a sound when it starts, and plays another sound when
// other clients join the experience
export default class ControllerExperience extends soundworks.Experience {
  constructor(assetsDomain, audioFiles) {
    super();

    this.platform = this.require('platform', { features: ['web-audio', 'wake-lock'] });
    this.checkin = this.require('checkin', { showDialog: false });
    this.sync = this.require('sync');
    this.scheduler = this.require('scheduler', { sync: true });
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

    //this.receive("startGame", this.startGame);

    this.startGame();

    this.roundsWon = [0, 0];

    this.receive("roundIsOver", (playerIndex) => this.roundIsOver(playerIndex));

    this.receive("delayNextDing", () => { 
      console.log("Delaying next ding");
      this.delayNextDing = true; 
    });

    // play the first loaded buffer immediately
    /*const src = audioContext.createBufferSource();
    src.buffer = this.loader.buffers[0];
    src.connect(audioContext.destination);
    src.start(audioContext.currentTime);*/
  }

  startGame() {
    this.currentRound = 0;
    this.playRound(0);

    const syncTime = this.scheduler.syncTime;
    this.scheduler.defer(() => this.startRound(), syncTime + 7, true);
    // this.scheduler.defer(() => this.roundIsOver(0), syncTime + 10, true);
    // this.scheduler.defer(() => this.roundIsOver(1), syncTime + 20, true);
    // this.scheduler.defer(() => this.roundIsOver(0), syncTime + 30, true);

    console.log('starting game: ', syncTime);
  }

  // winner is 0 or 1
  roundIsOver(winner) {
    this.roundsWon[winner] += 1;

    this.stopRound(); // stop music
    if(this.roundsWon[0] == 2 || this.roundsWon[1] == 2 || this.roundsWon[0] + this.roundsWon[1] == 3) {
      // game over
      console.log("Playing game over");
      const src = audioContext.createBufferSource();
      src.buffer = this.loader.buffers[6];
      src.connect(audioContext.destination);
      src.start(audioContext.currentTime);
    } else {
      // go the next round
      this.currentRound++;
      this.scheduler.defer(() => this.playRound(this.currentRound), this.scheduler.syncTime + 3, true);
      this.scheduler.defer(() => this.startRound(), this.scheduler.syncTime + 6, true);
    }
  }

  startRound() {
    console.log("starting round");
    this.send("startRound");

    this.delayNextDing = false;

    var hasStartedMusic = false;

    const dingFunction = () => {
      const nextEventNbrPeriod = Math.floor(Math.random() * 6 + 6);
      console.log("scheduled ding for", nextEventNbrPeriod, "periods");
      return nextEventNbrPeriod;
    }; 

    this.musicSynth = new Synth(this.sync, 0.5, () => 32, (thisTime, nextTime) => {
      // play music
      console.log("starting music");

      const env = audioContext.createGain();
      env.connect(audioContext.destination);
      env.gain.value = 0.5;

      this.musicSrc = audioContext.createBufferSource();
      this.musicSrc.buffer = this.loader.buffers[2];
      this.musicSrc.connect(env);
      this.musicSrc.start(thisTime);
    });    

    this.dingSynth = new Synth(this.sync, 0.5, dingFunction, (thisTime, nextTime) => { 
      if(hasStartedMusic) {
        if(this.delayNextDing) {
          this.delayNextDing = false;
        } else {
          // use time to play a sound at time
          const src = audioContext.createBufferSource();
          src.buffer = this.loader.buffers[1];
          src.connect(audioContext.destination);
          src.start(nextTime);

          this.send("ding");          
        }
      } else {
        hasStartedMusic = true;
      }
    });

    this.scheduler.add(this.dingSynth);
    this.scheduler.add(this.musicSynth);
  }

  stopRound() {
    console.log("stopping round");
    this.scheduler.remove(this.dingSynth);
    this.scheduler.remove(this.musicSynth);

    this.musicSrc.stop();
  }

  playRound(number) {
    console.log("playing round", number, "sound");
    const src = audioContext.createBufferSource();
    src.buffer = this.loader.buffers[3 + number];
    src.connect(audioContext.destination);
    src.start(audioContext.currentTime);
  }
}
