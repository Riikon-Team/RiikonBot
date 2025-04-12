import logger from '../logger.js';
import { TelegramApi } from './api.js';
import { setupCommandPolling } from './polling.js';
import { formatUptime } from './helpers.js';

// Global variables
let telegramApi = null;
let botToken = null;
let chatId = null;
let client = null;
let config = {
  commandPrefix: '/',
  allowedUsers: [],
  enabled: false
};
let pollingController = null;

// Initialize the Telegram logger
export async function initializeTelegram(discordClient) {
  client = discordClient;
  
  try {
    // Get configuration from environment
    botToken = process.env.TELEGRAM_BOT_TOKEN;
    chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId) {
      logger.warn('Telegram logger not configured. Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env file.');
      return false;
    }
    
    // Load configuration
    config = {
      commandPrefix: '/',
      allowedUsers: [],
      enabled: true
    };
    
    // Initialize Telegram API
    telegramApi = new TelegramApi(botToken);
    
    // Test the connection
    const botInfo = await telegramApi.getMe();
    logger.info(`Telegram bot connected as: ${botInfo.username}`);
    
    // Start polling for commands
    pollingController = setupCommandPolling(telegramApi, config, client, chatId);
    
    // Send startup message
    await sendMessage(`🟢 Bot started at ${new Date().toISOString()}`);
    
    return true;
  } catch (error) {
    logger.error('Error initializing Telegram logger:', error);
    return false;
  }
}

// Send a message to the configured Telegram chat
export async function sendMessage(text) {
  if (!config.enabled || !telegramApi || !chatId) return;
  
  try {
    await telegramApi.sendMessage(chatId, text);
    logger.debug(`Sent to Telegram: ${text}`);
  } catch (error) {
    logger.error(`Failed to send Telegram message: ${error.message}`);
  }
}

// Stop the Telegram logger
export function shutdown() {
  if (pollingController) {
    pollingController.stop();
    pollingController = null;
  }
  
  if (telegramApi && config.enabled) {
    sendMessage(`🔴 Bot shut down at ${new Date().toISOString()}`);
  }
}

// Utility exports
export { formatUptime };