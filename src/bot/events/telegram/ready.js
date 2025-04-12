import { sendMessage } from '../../../utils/telegram/index.js';

export const config = {
  name: 'ready',
  once: true
};

export async function execute(client) {
  await sendMessage(`✅ Bot connected to Discord as ${client.user.tag}`);
}