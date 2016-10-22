import { Experience } from 'soundworks/server';

// server-side 'player' experience.
export default class PlayerExperience extends Experience {
  constructor(clientType) {
    super(clientType);

    this.checkin = this.require('checkin');
    this.sync = this.require('sync');
    this.sharedConfig = this.require('shared-config');

    this.playingClient = -1;
  }

  // if anything needs to append when the experience starts
  start() {}

  // if anything needs to happen when a client enters the performance (*i.e.*
  // starts the experience on the client side), write it in the `enter` method
  enter(client) {
    super.enter(client);

    var clients = this.clients;
    function findOtherClient() {
      for(let otherClient of clients) {
        if(otherClient.index != client.index) {
          return otherClient;
        }
      }

      throw new Error("Can't fiind other client");
    }

    this.receive(client, 'moved', (label, timeProgression) => {
      console.log("REAL moved recieved from", client.index, "label", label, "timeProgression", timeProgression);

      //this.send(findOtherClient(), "otherMoved", label);
    });

    this.receive(client, 'debugMotion', (label, timeProgression) => {
      console.log("DEBUG moved recieved from", client.index, "label", label, "timeProgression", timeProgression);

      //this.send(findOtherClient(), "otherMoved", label);
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



    // When the game starts
    if(this.clients.length > 1) {
      this.broadcast(client.type, client, 'play');
      console.log("ready to play");

      this.playingClient = this.clients[0];
      this.send(this.playingClient, "go");
    }
  }

  exit(client) {
    super.exit(client);
    // ...
  }
}
