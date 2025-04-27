import fs, { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import logger from '../../../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.join(__dirname, "..", "package.json"), 'utf-8'))

// Command collection
const prefixCommands = new Map();

// Process messages for prefix commands
export async function processMessage(message, client, prefix) {
  if (message.author.bot) return;
  
  if (!message.content.startsWith(prefix)) return;
  
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  const command = prefixCommands.get(commandName);
  if (!command) return;
  
  try {
    await command.execute(message, args, client);
    logger.debug(`Executed prefix command ${commandName} for ${message.author.tag}`);
  } catch (error) {
    logger.error(`Error executing prefix command ${commandName}:`, error);
    await message.reply('There was an error executing that command!').catch(() => {});
  }
}

// Register prefix commands
export function registerPrefixCommands(client, config) {
  // Load all prefix commands from this directory
  const commandFiles = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.js') && file !== 'index.js');
    
  for (const file of commandFiles) {
    (async () => {
      try {
        const filePath = path.join(__dirname, file);
        const commandModule = await import(pathToFileURL(filePath).href);
        
        if (commandModule.config && commandModule.execute) {
          const commandName = commandModule.config.name || path.basename(file, '.js');
          
          prefixCommands.set(commandName, {
            config: commandModule.config,
            execute: commandModule.execute
          });
          
          logger.debug(`Loaded prefix command: ${commandName} from standard package`);
        } else {
          logger.warn(`Prefix command file ${file} is missing config or execute function`);
        }
      } catch (error) {
        logger.error(`Error loading prefix command from ${file}:`, error);
      }
    })();
  }
  
  // Register message handler for standard package
  client.packageManager.registerEventListener('messageCreate', (message, client) => {
    const prefix = config.prefix || 'k!';
    processMessage(message, client, prefix);
  }, 'standard-prefix-commands');
  
  // Attach the getAllPrefixCommands function to the packageManager
  if (client.packageManager) {
    // Add the function to the packageManager so it's accessible from API
    client.packageManager.getAllPrefixCommands = getAllPrefixCommands;
    logger.info('Attached getAllPrefixCommands function to package manager');
  } else {
    logger.error('Cannot attach getAllPrefixCommands: packageManager not available on client');
  }
}

// Get all prefix commands for help system
export function getAllPrefixCommands() {
  logger.debug(`Getting all prefix commands (${prefixCommands.size} commands found)`);
  return Array.from(prefixCommands.entries()).map(([name, command]) => ({
    name,
    ...command.config,
    package: command.config?.package || 'social',
    prefix: pkg.config.prefix
  }));
}
