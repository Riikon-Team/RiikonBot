import logger from '../../utils/logger.js';
import { TelegramApi } from './utils/telegramApi.js';
import { registerEvents } from './events/index.js';
import { registerCommands } from './commands/index.js';
import { setupCommandPolling } from './utils/polling.js';
import { formatUptime } from './utils/helpers.js';

// Global package variables
let config = null;
let packageManager = null;
let botClient = null;
let telegramApi = null;
let botToken = null;
let chatId = null;
let pollingController = null;

// Initialize the package
export async function initialize(client, manager, packageConfig) {
  packageManager = manager;
  config = packageConfig;
  botClient = client;
  
  // Set up bot token and chat ID from environment variables or config
  botToken = process.env.TELEGRAM_BOT_TOKEN || config.botToken;
  chatId = process.env.TELEGRAM_CHAT_ID || config.chatId;
  const enabled = process.env.TELEGRAM_ENABLED || false ? chatId : null;

  if (!enabled) {
    logger.warn('Telegram logger is not enabled. Please set TELEGRAM_ENABLED to true.');
    return;
  }
  
  if (!botToken || !chatId) {
    logger.warn('Telegram logger not fully configured. Please set botToken and chatId in configuration.');
    return;
  }
  
  // Initialize Telegram API
  telegramApi = new TelegramApi(botToken);
  
  // Register event listeners for various bot events
  registerEvents(packageManager, sendMessage);
  
  // Register Discord commands
  registerCommands(client);
  
  // Log bot startup
  if (config.startupMessage && config.enabled) {
    await sendMessage(`🟢 RiikonBot started at ${new Date().toISOString()}`);
  }
  
  // Start listening for Telegram commands if configuration allows
  if (config.enabled) {
    pollingController = setupCommandPolling(telegramApi, config, botClient, chatId);
  }
  
  logger.info('Telegram logger package initialized');
}

// Send a message to the configured Telegram chat
export async function sendMessage(text) {
  if (!config.enabled || !telegramApi) return;
  
  try {
    await telegramApi.sendMessage(chatId, text);
    logger.debug(`Sent to Telegram: ${text}`);
  } catch (error) {
    logger.error(`Failed to send Telegram message: ${error.message}`);
  }
}

// Called when package config is updated
export async function onConfigUpdate(newConfig) {
  const wasEnabled = config.enabled;
  config = newConfig;
  
  // Update token and chat ID in case they changed
  botToken = process.env.TELEGRAM_BOT_TOKEN || config.botToken;
  chatId = process.env.TELEGRAM_CHAT_ID || config.chatId;
  
  if (!wasEnabled && config.enabled) {
    // Reinitialize the Telegram API if newly enabled
    telegramApi = new TelegramApi(botToken);
    pollingController = setupCommandPolling(telegramApi, config, botClient, chatId);
    await sendMessage(`🟢 Telegram logger enabled at ${new Date().toISOString()}`);
  } else if (wasEnabled && !config.enabled) {
    // Stop polling if disabled
    if (pollingController) {
      pollingController.stop();
      pollingController = null;
    }
  }
  
  logger.info('Telegram logger package config updated');
}

// Called when package is enabled
export async function onEnable() {
  if (config.enabled && telegramApi) {
    await sendMessage(`🟢 Telegram logger enabled at ${new Date().toISOString()}`);
    pollingController = setupCommandPolling(telegramApi, config, botClient, chatId);
  }
  logger.info('Telegram logger package enabled');
}

// Called when package is disabled
export async function onDisable() {
  if (config.enabled && telegramApi) {
    await sendMessage(`🔴 Telegram logger disabled at ${new Date().toISOString()}`);
  }
  
  if (pollingController) {
    pollingController.stop();
    pollingController = null;
  }
  
  logger.info('Telegram logger package disabled');
}

// Export utility functions and variables
export function getClient() {
  return botClient;
}

export function getConfig() {
  return config;
}

export function getTelegramApi() {
  return telegramApi;
}

export { formatUptime };
