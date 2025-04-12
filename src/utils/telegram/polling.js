import logger from '../logger.js';
import { processCommand } from './commands.js';

let lastUpdateId = 0;
let isPolling = false;
let shouldContinuePolling = false;
let pollTimeoutId = null;

export function setupCommandPolling(telegramApi, config, client, chatId) {
  // Stop any existing polling
  stopPolling();
  
  // Set flags to start polling
  shouldContinuePolling = true;
  
  logger.info('Starting Telegram command polling...');
  
  // Start the polling process
  startPolling(telegramApi, config, client, chatId);
  
  // Return a function that can be used to stop polling
  return {
    stop: stopPolling
  };
}

function startPolling(telegramApi, config, client, chatId) {
  // Don't start if we shouldn't continue or if already polling
  if (!shouldContinuePolling || isPolling) return;
  
  isPolling = true;
  
  // Execute a single poll
  pollOnce(telegramApi, config, client, chatId)
    .finally(() => {
      isPolling = false;
      
      // If we should continue, schedule the next poll
      if (shouldContinuePolling) {
        pollTimeoutId = setTimeout(() => {
          startPolling(telegramApi, config, client, chatId);
        }, 3000); // 3 second delay between polls
      }
    });
}

async function pollOnce(telegramApi, config, client, chatId) {
  try {
    logger.debug('Polling for Telegram updates...');
    const updates = await telegramApi.getUpdates(lastUpdateId + 1);
    
    if (updates && updates.length > 0) {
      logger.info(`Received ${updates.length} Telegram updates`);
      lastUpdateId = updates[updates.length - 1].update_id;
      
      for (const update of updates) {
        if (update.message && update.message.text) {
          logger.debug(`Processing update: ${JSON.stringify(update.message)}`);
          await processCommand(update.message, telegramApi, config, client, chatId);
        } else {
          logger.debug('Skipping update without message text');
        }
      }
    }
  } catch (error) {
    logger.error(`Error polling Telegram updates: ${error.message}`, error);
  }
}

function stopPolling() {
  logger.info('Stopping Telegram command polling');
  shouldContinuePolling = false;
  
  if (pollTimeoutId) {
    clearTimeout(pollTimeoutId);
    pollTimeoutId = null;
  }
}