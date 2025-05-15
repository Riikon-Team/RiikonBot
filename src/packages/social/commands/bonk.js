import { displayCurrentTime } from '../../../utils/commandUtilities.js';
import { EmbedBuilder } from 'discord.js'

export const config = {
    name: 'bonk',
    description: 'Bonk someone you want :D',
    category: 'Social',
    package: 'social',
    options: [
        {
            type: 'user',
            name: 'target',
            description: 'Your target',
            required: true
        }
    ]
}

export async function execute(interaction, client) {
    const user = interaction.user
    const target = interaction.options.getUser("target")
    const embed = new EmbedBuilder()
        .setTitle("Bonk 🦴")
        .setDescription(`**${user.username}** tells me to send a bonk to **${target.username}**`)
        .setImage("https://25.media.tumblr.com/tumblr_mba6r8hpmi1qey6kro1_500.gif")
        .setFooter({text: `Send at ${displayCurrentTime()}`})

    await interaction.reply({embeds: [embed]})
}