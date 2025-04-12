import { sendMessage } from '../../../utils/telegram/index.js';

export const config = {
  name: 'guildDelete',
  once: false
};

export async function execute(guild, client) {
  await sendMessage(`➖ Bot removed from server: ${guild.name} (${guild.id})`);
}