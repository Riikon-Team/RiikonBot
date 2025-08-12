import { handleVoiceStateUpdate } from './voiceStateUpdate.js';

export function registerEvents(client, packageManager, config) {
  // Register voice state update handler
  packageManager.registerEventListener('voiceStateUpdate', handleVoiceStateUpdate, 'tracker');
}
