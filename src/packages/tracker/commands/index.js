import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import logger from '../../../utils/logger.js';
import { SlashCommandBuilder } from 'discord.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function registerCommands(client) {
  try {
    const commandFiles = fs.readdirSync(__dirname)
      .filter(file => file.endsWith('.js') && file !== 'index.js');
      
    for (const file of commandFiles) {
      (async () => {
        try {
          const filePath = path.join(__dirname, file);
          const commandModule = await import(pathToFileURL(filePath).href);
          
          if (commandModule.config && commandModule.execute) {
            const commandName = commandModule.config.name || path.basename(file, '.js');
            
            // Register the command with the client
            client.commands.set(commandName, {
              config: commandModule.config,
              execute: commandModule.execute
            });
            
            logger.debug(`Registered slash command: ${commandName} from standard package`);
          } else {
            logger.warn(`Command file ${file} is missing config or execute function`);
          }
        } catch (error) {
          logger.error(`Error loading command from ${file}:`, error);
        }
      })();
    }
  } catch (error) {
    logger.error("Error registering standard package commands:", error);
  }
}

// Gets command definitions for the slash command update utility
export async function getCommands() {
  const commands = [];
  const commandFiles = fs.readdirSync(__dirname)
    .filter(file => file.endsWith('.js') && file !== 'index.js');
    
  for (const file of commandFiles) {
    try {
      const filePath = path.join(__dirname, file);
      const commandModule = await import(pathToFileURL(filePath).href);
      
      if (commandModule.config) {
        const { name, description, options = [] } = commandModule.config;
        
        if (name && description) {
          const command = new SlashCommandBuilder()
            .setName(name)
            .setDescription(description);
            
          // Add options if any
          if (options.length > 0) {
            for (const option of options) {
              // Handle different option types
              // This is a simplified example - expand as needed
              if (option.type === 'string') {
                command.addStringOption(opt => 
                  opt.setName(option.name)
                     .setDescription(option.description)
                     .setRequired(option.required || false));
              }
              // Add other option types as needed
            }
          }
            
          commands.push(command.toJSON());
        }
      }
    } catch (error) {
      logger.error(`Error building command definition from ${file}:`, error);
    }
  }
  
  return commands;
}
