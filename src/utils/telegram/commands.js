import logger from '../logger.js';
import { formatUptime } from './helpers.js';

// Process incoming Telegram commands
export async function processCommand(message, telegramApi, config, client, chatId) {
  try {
    if (!message || !message.text) {
      logger.error('Invalid message object received in processCommand');
      return;
    }

    const { text, from } = message;
    const userId = from.id.toString();

    logger.info(`Telegram: Received message from user ${userId}: ${text}`);
    
    // Check if this user is allowed to control the bot
    if (config.allowedUsers && config.allowedUsers.length > 0 && !config.allowedUsers.includes(userId)) {
      logger.warn(`Telegram: Unauthorized user ${userId} attempted to use command: ${text}`);
      await telegramApi.sendMessage(chatId, `❌ User ${from.username || userId} is not authorized to control the bot.`);
      return;
    }
    
    // Check for command prefix
    if (!text.startsWith(config.commandPrefix)) {
      logger.debug(`Telegram: Message doesn't start with command prefix: ${text}`);
      return;
    }
    
    const command = text.substring(config.commandPrefix.length).split(' ')[0].toLowerCase();
    logger.info(`Telegram: Processing command: ${command}`);
    
    switch (command) {
      case 'status':
        await handleStatusCommand(client, telegramApi, chatId);
        break;
      case 'servers':
        await handleServersCommand(client, telegramApi, chatId);
        break;
      case 'users':
        await handleUsersCommand(client, telegramApi, chatId);
        break;
      case 'help':
        await handleHelpCommand(config, telegramApi, chatId);
        break;
      default:
        logger.warn(`Telegram: Unknown command received: ${command}`);
        await telegramApi.sendMessage(chatId, `Unknown command: ${command}\nType ${config.commandPrefix}help for available commands.`);
    }
  } catch (error) {
    logger.error(`Error processing Telegram command: ${error.message}`, error);
    try {
      await telegramApi.sendMessage(chatId, `❌ Error processing command: ${error.message}`);
    } catch (sendError) {
      logger.error(`Failed to send error message to Telegram: ${sendError.message}`);
    }
  }
}

// Help command handler
export async function handleHelpCommand(config, telegramApi, chatId) {
  const commands = [
    `${config.commandPrefix}status - Show bot status information`,
    `${config.commandPrefix}servers - List all connected servers`,
    `${config.commandPrefix}users - Show total user count`,
    `${config.commandPrefix}help - Show this help message`
  ].join('\n');
  
  const message = `📚 **Available Commands**:\n${commands}`;
  await telegramApi.sendMessage(chatId, message);
}

// Status command handler
export async function handleStatusCommand(client, telegramApi, chatId) {
  const uptime = formatUptime(client.uptime);
  const serverCount = client.guilds.cache.size;
  const userCount = client.users.cache.size;
  
  const message = `📊 **Bot Status**
⏱️ Uptime: ${uptime}
🖥️ Servers: ${serverCount}
👥 Users: ${userCount}
🟢 Status: Online`;
  
  await telegramApi.sendMessage(chatId, message);
}

// Servers command handler
export async function handleServersCommand(client, telegramApi, chatId) {
  const serverList = client.guilds.cache.map(g => `• ${g.name} (${g.id}) - ${g.memberCount} members`).join('\n');
  const message = `📋 **Server List** (${client.guilds.cache.size}):\n${serverList || 'No servers found'}`;
  
  await telegramApi.sendMessage(chatId, message);
}

// Users command handler
export async function handleUsersCommand(client, telegramApi, chatId) {
  const message = `👥 **Users**: ${client.users.cache.size} users across all servers`;
  await telegramApi.sendMessage(chatId, message);
}