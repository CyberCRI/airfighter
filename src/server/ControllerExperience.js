import { Experience } from 'soundworks/server';

class ControllerExperience extends Experience {
  constructor(clientType, experiences) {
    super(clientType);

    this.experiences = experiences;
    this.checkin = this.require('checkin');
    this.sync = this.require('sync');

    this.playing = false;
  }

  // if anything needs to happen when a client enters the performance (*i.e.*
  // starts the experience on the client side), write it in the `enter` method
  enter(client) {
    super.enter(client);

    console.log("Controller client entering");

    this.receive(client, 'ding', () => {
      console.log("sending ding to players");
      this.experiences.player.sendDing();
    });

    this.receive(client, 'startRound', () => {
      console.log("starting round");
      this.experiences.player.startRound();
    });

    /*if(this.isReadyToPlay() && !this.playing) {
      // start game
      this.playing = true;

      console.log("Telling controller client to start");
      this.send(client, "startGame");
    }*/
  }

  isReadyToPlay() {
    return true;
    //return this.clients.length > 0 && this.experiences.player.isReadyToPlay();
  }

  exit(client) {
    super.exit(client);
  }
}

export default ControllerExperience;
