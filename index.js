import { Client, GatewayIntentBits, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import logger from './src/utils/logger.js';
import { setupDatabase } from './src/utils/database.js';
import { startWebServer } from './src/web/server.js';
import { initializeTelegram, shutdown as shutdownTelegram } from './src/utils/telegram/index.js';
// Khởi tạo môi trường
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Khởi tạo client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Khởi tạo collections
client.commands = new Collection();
client.prefixCommands = new Collection();
client.config = {
  prefix: process.env.PREFIX || '!'
};

// Đăng ký các lệnh slash
async function registerSlashCommands() {
  const commandsPath = path.join(__dirname, 'src', 'bot', 'commands', 'slash');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(`file://${filePath}`);
    
    if ('config' in command && 'execute' in command) {
      client.commands.set(command.config.name, command);
      logger.info(`Đã đăng ký lệnh slash: ${command.config.name}`);
    } else {
      logger.warn(`Lệnh tại ${filePath} thiếu thuộc tính config hoặc execute`);
    }
  }
}

// Đăng ký các lệnh prefix
async function registerPrefixCommands() {
  const commandsPath = path.join(__dirname, 'src', 'bot', 'commands', 'prefix');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(`file://${filePath}`);
    
    if ('config' in command && 'execute' in command) {
      client.prefixCommands.set(command.config.name, command);
      logger.info(`Đã đăng ký lệnh prefix: ${command.config.name}`);
    } else {
      logger.warn(`Lệnh tại ${filePath} thiếu thuộc tính config hoặc execute`);
    }
  }
}

// Đăng ký các event handlers
async function registerEvents() {
  const eventsPath = path.join(__dirname, 'src', 'bot', 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = await import(`file://${filePath}`);
    
    if ('config' in event && 'execute' in event) {
      if (event.config.once) {
        client.once(event.config.name, (...args) => event.execute(...args, client));
      } else {
        client.on(event.config.name, (...args) => event.execute(...args, client));
      }
      logger.info(`Đã đăng ký event: ${event.config.name}`);
    } else {
      logger.warn(`Event tại ${filePath} thiếu thuộc tính config hoặc execute`);
    }
  }
}

// Khởi động bot
async function initialize() {
  try {
    logger.info("Starting RiikonBot... 0/7");
    
    // 1. Setup database first
    logger.info("Setting up database...");
    await setupDatabase();
    
    // 2. Register commands and events
    logger.info("Registering commands and events... 1/7");
    await registerSlashCommands();
    logger.info("Registered slash commands... 2/7");
    await registerPrefixCommands();
    logger.info("Registered prefix commands... 3/7");
    await registerEvents();
    logger.info("Registered events... 4/7");
    
    // 3. Start Discord bot
    logger.info("Starting Discord bot... 5/7");
    await client.login(process.env.DISCORD_TOKEN);
    logger.info(`Bot đã đăng nhập thành công với tên ${client.user.tag}`);

    // 4. Initialize Telegram logger
    logger.info("Initializing Telegram logger... 6/7");
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      logger.warn("TELEGRAM_BOT_TOKEN is not set. Telegram logger will not be initialized.");
    } else {
      logger.info("TELEGRAM_BOT_TOKEN is set. Initializing Telegram logger...");
      await initializeTelegram(client);
    }
    
    // 5. Start web server
    logger.info("Starting web server... 7/7");
    if (!process.env.WEB_PORT) {
      logger.warn("WEB_PORT is not set.  Defaulting to 3100.");
    }
    const webServer = await startWebServer(client);
    logger.info('RiikonBot successfully initialized and running!');

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    logger.error('Failed to initialize RiikonBot:', error);
    process.exit(1);
  }
}

async function shutdown() {
  logger.info("Shutting down RiikonBot...");
  
  // Shutdown Telegram logger
  await shutdownTelegram();
  process.exit(0);
}

initialize();