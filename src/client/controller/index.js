// import client side soundworks and player experience
import * as soundworks from 'soundworks/client';
import ControllerExperience from './ControllerExperience.js';
import viewTemplates from '../shared/viewTemplates';
import viewContent from '../shared/viewContent';

// list of files to load (passed to the experience)
const files = [
  'sounds/sound-welcome.mp3',
  'sounds/Air_Fighter_Ding_5.mp3',
  'sounds/Air_Fighter_Music.mp3',
  'sounds/Air_Fighter_Round_1.mp3',  
  'sounds/Air_Fighter_Round_2.mp3',  
  'sounds/Air_Fighter_Round_3.mp3',
  'sounds/Air_Fighter_Music_GameOver.mp3'
];

// launch application when document is fully loaded
window.addEventListener('load', () => {
  // configuration received from the server through the `index.html`
  // @see {~/src/server/index.js}
  // @see {~/html/default.ejs}
  const { appName, clientType, socketIO, assetsDomain }  = window.soundworksConfig;

  soundworks.client.init(clientType, { appName, socketIO });
  soundworks.client.setViewContentDefinitions(viewContent);
  soundworks.client.setViewTemplateDefinitions(viewTemplates);

  const experience = new ControllerExperience(assetsDomain, files);

  // start the client
  soundworks.client.start();
});
