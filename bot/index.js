import { Client, GatewayIntentBits, IntentsBitField, Events, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DISCORD_TOKEN } from './constants/bot.js';
import { genarateHelpDoc } from './utils/helpdoc.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const startBot = async () => {
    const client = new Client({
        intents: [
            GatewayIntentBits.GuildPresences,     
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers,        
        ],
    });

    // Register commands with ./prefix-commands
    client.prefixCommands = new Collection();
    const prefixCommandsPath = path.join(__dirname, 'prefix-commands');
    const prefixCommandFiles = fs.readdirSync(prefixCommandsPath).filter(file => file.endsWith('.js'));

    for (const file of prefixCommandFiles) {
        const filePath = path.join(prefixCommandsPath, file);
        const commandModule = await import(filePath);
        const command = commandModule.default;
        if ('data' in command && 'execute' in command) {
            client.prefixCommands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The prefix command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }

    // Register event from ./events
    const eventsPath = path.join(__dirname, 'events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const eventModule = await import(filePath);
        const event = eventModule.default;
        client.on(event.name, event.execute);
    }

    // Register commands from ./commands
    client.commands = new Collection();
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const commandModule = await import(filePath);
        const command = commandModule.default; 
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }

    // Timeout collection for commands and interactions
    client.timeoutCollection = new Collection();

    // Create Helpdocs
    client.helpDocs = genarateHelpDoc(client.commands, client.prefixCommands);

    // Create Chat Session Map
    client.chatSessions = new Map();

    

    // Login to Discord with your client's token
    await client.login(DISCORD_TOKEN);

    return client;
};

export default startBot;