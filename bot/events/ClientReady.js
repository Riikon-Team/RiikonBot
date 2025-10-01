import { Events } from 'discord.js';

export default {
    name: Events.ClientReady,
    async execute(client) {
        console.log(`Bot ${client.user.tag} is online and ready!`);
    }
};