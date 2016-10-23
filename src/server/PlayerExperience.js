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

  // if anything needs to happen when a client enters the performance (*i.e.*
  // starts the experience on the client side), write it in the `enter` method
  enter(client) {
    super.enter(client);

    console.log("Player Client entering", client.index);
    
    this.receive(client, 'end', () => {
      console.log("recieved end from player", client.index);
      this.experiences.controller.roundIsOver(client.index == 0 ? 1 : 0);
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

    /*this.receive(client, 'hit', (mag, hitTime) => {
      console.log("hit recieved from", client.index, "mag", mag);
      if(this.playingClient.index != client.index) return;

      this.playingClient = client;

      for(let otherClient of this.clients) {
        if(otherClient.index != client.index) {
          console.log("Sending go to", otherClient.index);
          this.send(otherClient, "go", hitTime);

          this.playingClient = otherClient;
        }
      }
    });

    this.receive(client, 'missed', () => {
      console.log("miseed recieved from", client.index);
      if(this.playingClient.index != client.index) return;

      this.playingClient = client;

      for(let otherClient of this.clients) {
        if(otherClient.index != client.index) {
          console.log("Sending go to", otherClient.index);
          this.send(otherClient, "go");

          this.playingClient = otherClient;
        }
      }
    });*/



    // // When the game starts
    // if(this.clients.length > 1) {
    //   this.broadcast(client.type, client, 'play');
    //   console.log("ready to play");

    //   this.playingClient = this.clients[0];
    //   this.send(this.playingClient, "go");
    // }
  }

  isReadyToPlay() {
    return this.clients.length > 1;
  }


  exit(client) {
    super.exit(client);
    // ...
  }
}
