import { registerEvents } from './events/index.js';
import { registerCommands } from './commands/index.js';
import { registerPrefixCommands } from './prefixCommands/index.js';
import logger from '../../utils/logger.js';
// import routes from './web/routes.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Global package variables
let config = null;
let packageManager = null;
let botClient = null;

// Initialize the package
export async function initialize(client, manager, packageConfig) {
  packageManager = manager;
  config = packageConfig;
  botClient = client;
  
  // Register event listeners
  registerEvents(client, manager, config);
  
  // Register slash commands
  registerCommands(client);
  
  // Register prefix commands
  registerPrefixCommands(client, config);
  
  // Define the package views directory
  const viewsPath = path.join(__dirname, 'web', 'views');
  
  // // Register web routes for package dashboard with package-specific views
  // packageManager.registerWebRoute('/standard', routes, 'standard', viewsPath);
  logger.info('Standard package web routes registered');
  
  logger.info('Standard package initialized as default package');
}

// Called when package config is updated
export async function onConfigUpdate(newConfig) {
  const oldPrefix = config?.prefix;
  config = newConfig;
  
  if (oldPrefix !== config.prefix) {
    logger.info(`Standard package prefix changed from ${oldPrefix} to ${config.prefix}`);
  }
  
  logger.info('Standard package config updated');
}

// Called when package is enabled
export async function onEnable() {
  logger.info('Standard package enabled');
}

// Utility functions for external use
export function getConfig() {
  return config;
}

export function getPackageManager() {
  return packageManager;
}

export function getClient() {
  return botClient;
}
