import { Experience } from 'soundworks/server';

// server-side 'player' experience.
export default class PlayerExperience extends Experience {
  constructor(clientType, experiences) {
    super(clientType);

    this.experiences = experiences;
    this.checkin = this.require('checkin');
    this.sync = this.require('sync');
    this.sharedConfig = this.require('shared-config');

    this.playingClient = -1;
  }

  // if anything needs to append when the experience starts
  start() {}

  sendDing() {
    for(let client of this.clients) {
      this.send(client, "ding");
    } 
  }

  startRound() {
    for(let client of this.clients) {
      this.send(client, "startRound");
    } 
  }

  // if anything needs to happen when a client enters the performance (*i.e.*
  // starts the experience on the client side), write it in the `enter` method
  enter(client) {
    super.enter(client);

    console.log("Player Client entering", client.index);
    
    this.receive(client, 'end', () => {
      console.log("recieved end from player", client.index);
      this.experiences.controller.roundIsOver(client.index == 0 ? 1 : 0);

      var otherClientIndex = client.index == 0 ? 1 : 0;
      console.log("otherClientIndex", otherClientIndex);
      this.send(this.clients[otherClientIndex], 'win');
    })

    this.receive(client, 'debugLikelihoods', (likelihoods) => {
      console.log("likelihoods", client.index, likelihoods);
    });

    this.receive(client, 'moved', (label, timeProgression) => {
      console.log("REAL moved recieved from", client.index, "label", label, "timeProgression", timeProgression);
      var otherClientIndex = client.index == 0 ? 1 : 0;
      console.log("otherClientIndex", otherClientIndex);
      this.send(this.clients[otherClientIndex], 'move', label);
    });

    this.receive(client, 'failed', (label, timeProgression) => {
      console.log("Failed recieved from", client.index, "label", label, "timeProgression", timeProgression);
    });

    this.receive(client, 'debugMotion', (label, timeProgression) => {
      console.log("DEBUG moved recieved from", client.index, "label", label, "timeProgression", timeProgression);
    });

    this.receive(client, "delayNextDing", () => { this.experiences.controller.delayNextDing(); });
  }

  isReadyToPlay() {
    return this.clients.length > 1;
  }


  exit(client) {
    super.exit(client);
    // ...
  }
}
