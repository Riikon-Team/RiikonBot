import { pingAction } from '../actions/system.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    cooldown: 5000,
    async execute(interaction) {
        const reply = pingAction(this.data.name, interaction);
        await interaction.reply(reply);
    }
};