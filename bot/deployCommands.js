import dotenv from 'dotenv';
import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMMANDS_DIR = path.join(__dirname, 'commands');

async function collectCommands() {
    const commands = [];
    
    const files = fs.readdirSync(COMMANDS_DIR)
        .filter(file => file.endsWith('.js'));
    
    for (const file of files) {
        const filePath = path.join(COMMANDS_DIR, file);
        const commandModule = await import(pathToFileURL(filePath).href);
        
        const cmds = Array.isArray(commandModule.default) 
            ? commandModule.default 
            : Object.values(commandModule).filter(cmd => cmd?.data);
        
        for (const cmd of cmds) {
            if (cmd?.data) {
                commands.push(cmd.data.toJSON());
                console.log(`✅ ${cmd.data.name}`);
            }
        }
    }
    
    return commands;
}

export async function deployCommands() {
    const { DISCORD_TOKEN, DISCORD_CLIENT_ID } = process.env;
    
    if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
        console.error('❌ Missing DISCORD_TOKEN or DISCORD_CLIENT_ID');
        process.exit(1);
    }
    
    console.log('📂 Loading commands...\n');
    const commands = await collectCommands();
    
    if (commands.length === 0) {
        console.log('⚠️  No commands found');
        return;
    }
    
    console.log(`\n🚀 Deploying ${commands.length} commands globally...`);
    
    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

    let mergedCommands = commands;
    try {
        const existing = await rest.get(Routes.applicationCommands(DISCORD_CLIENT_ID));
        if (Array.isArray(existing) && existing.length > 0) {
            const existingToKeep = existing.filter(ec => !commands.some(nc => nc.name === ec.name));
            if (existingToKeep.length > 0) {
                console.log(`ℹ️ Preserving ${existingToKeep.length} existing command(s) not present in collected commands.`);
                mergedCommands = [...commands, ...existingToKeep];
            }
        }
    } catch (err) {
        console.warn('⚠️ Could not fetch existing commands, proceeding with collected commands:', err.message);
    }

    await rest.put(
        Routes.applicationCommands(DISCORD_CLIENT_ID),
        { body: mergedCommands }
    );
    
    console.log('✅ Deploy complete!\n');
}
