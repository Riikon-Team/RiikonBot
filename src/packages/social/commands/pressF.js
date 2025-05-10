import { displayCurrentTime } from '../../../utils/commandUtilities.js';
import { EmbedBuilder } from 'discord.js'

//Just temporary code too
const image = "https://media.tenor.com/enlgLAA9qnsAAAAM/press-f-pay-respect.gif"

export const config = {
    name: 'f',
    description: 'Press F to pay respect',
    category: 'Meme',
    package: 'social',
    options: []
}

export async function execute(interaction, client) {
    const user = interaction.user
    const embed = new EmbedBuilder()
        .setTitle(`${user.username} has pressed F to pay respect`)
        .setImage(image)
        .setFooter({text: `Send at ${displayCurrentTime()}`})

    await interaction.reply({embeds: [embed]})
}