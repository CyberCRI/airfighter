import { Experience } from 'soundworks/server';

class ControllerExperience extends Experience {
  constructor(clientType, experiences) {
    super(clientType);

    this.experiences = experiences;
    this.checkin = this.require('checkin');
    this.sync = this.require('sync');

  }

  // if anything needs to happen when a client enters the performance (*i.e.*
  // starts the experience on the client side), write it in the `enter` method
  enter(client) {
    super.enter(client);

    console.log("Controller client entering");

    this.receive(client, 'ding', () => {
      console.log("sending ding to server");
      this.experiences.player.sendDing();
    });
  }

  isReadyToPlay() {
    return this.clients.length > 0;
  }

  exit(client) {
    super.exit(client);
  }
}

export default ControllerExperience;
