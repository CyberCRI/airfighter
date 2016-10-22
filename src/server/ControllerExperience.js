import { BasicSharedController } from 'soundworks/server';

class ControllerExperience extends BasicSharedController {
  constructor(clientType) {
    super(clientType);

    this.checkin = this.require('checkin', { showDialog: false });
    this.sync = this.require('sync');
  }
}

export default ControllerExperience;
