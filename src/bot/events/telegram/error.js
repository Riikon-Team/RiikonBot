import { sendMessage } from '../../../utils/telegram/index.js';

export const config = {
  name: 'error',
  once: false
};

export async function execute(error, client) {
  await sendMessage(`❌ Error: ${error.message || error}`);
  console.error(error);
}