import { getAvatarAction } from '../actions/system.js';
import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Replies with the avatar of the user or mentioned user.')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to get the avatar of')
                .setRequired(false)),
    cooldown: 5000,
    async execute(interaction) {
        const user = interaction.options.getUser('user') || interaction.user;
        const reply = getAvatarAction(this.data.name, user);
        await interaction.reply(reply);
    }
};
