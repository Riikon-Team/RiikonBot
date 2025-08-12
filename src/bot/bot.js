import { Client, GatewayIntentBits, Events, Collection } from 'discord.js';
import logger from '../utils/logger.js';

export async function startBot(packageManager) {
  // Create a new Discord client with relevant intents
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildPresences,
    ]
  });
  
  // Create a collection for commands
  client.commands = new Collection();
  
  // Store packageManager in client for easy access in commands
  client.packageManager = packageManager;
  
  // Forward Discord events to package manager
  client.on(Events.ClientReady, async () => {
    logger.info(`Bot logged in as ${client.user.tag}`);
    await packageManager.emitEvent('clientReady', client);
  });
  
  client.on(Events.MessageCreate, async (message) => {
    // Skip bot messages to avoid potential loops
    if (!message.author.bot) {
      await packageManager.emitEvent('messageCreate', message, client);
    }
  });
  
  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
      try {
        const commandName = interaction.commandName;
        // Try to find command in client.commands collection
        const command = client.commands.get(commandName);
        
        if (command) {
          await command.execute(interaction, client);
          logger.debug(`Executed command ${commandName} from command collection`);
        } else {
          // If command not in collection, emit to package handlers
          await packageManager.emitEvent('commandInteraction', interaction, client);
        }
      } catch (error) {
        logger.error(`Error executing command ${interaction.commandName}:`, error);
        
        // Reply with error if haven't replied yet
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: 'There was an error executing this command!',
            ephemeral: true
          }).catch(() => {});
        }
      }
    } else if (interaction.isButton()) {
      await packageManager.emitEvent('buttonInteraction', interaction, client);
    } else if (interaction.isSelectMenu()) {
      await packageManager.emitEvent('selectMenuInteraction', interaction, client);
    } else if (interaction.isModalSubmit()) {
      await packageManager.emitEvent('modalSubmitInteraction', interaction, client);
    }
  });
  
  // Register other important events
  client.on(Events.GuildCreate, async (guild) => {
    logger.info(`Bot joined a new guild: ${guild.name} (${guild.id})`);
    await packageManager.emitEvent('guildCreate', guild);
  });
  
  client.on(Events.GuildDelete, async (guild) => {
    logger.info(`Bot left a guild: ${guild.name} (${guild.id})`);
    await packageManager.emitEvent('guildDelete', guild);
  });
  
  client.on(Events.Error, async (error) => {
    logger.error('Discord client error:', error);
    await packageManager.emitEvent('error', error);
  });

  client.on(Events.Warn, async (warning) => {
    logger.warn('Discord client warning:', warning);
    await packageManager.emitEvent('warn', warning);
  });

  // Voice Events
  client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    await packageManager.emitEvent('voiceStateUpdate', oldState, newState, client);
  });

  client.on(Events.VoiceServerUpdate, async (voiceServer) => {
    await packageManager.emitEvent('voiceServerUpdate', voiceServer, client);
  });


  // Initialize packages with client
  await packageManager.initializePackages(client);
  
  // Login to Discord
  try {
    await client.login(process.env.DISCORD_TOKEN);
    logger.info("Successfully logged in to Discord");
  } catch (error) {
    logger.error("Failed to log in to Discord:", error);
    throw error;
  }
  
  return client;
}
