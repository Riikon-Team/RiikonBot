import { sendMessage } from '../../../utils/telegram/index.js';

export const config = {
  name: 'guildCreate',
  once: false
};

export async function execute(guild, client) {
  await sendMessage(`➕ Bot added to new server: ${guild.name} (${guild.id})`);
}