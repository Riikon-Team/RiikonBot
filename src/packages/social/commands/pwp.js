import { displayCurrentTime } from '../../../utils/commandUtilities.js';
import { EmbedBuilder } from 'discord.js'

export const config = {
    name: 'pwp',
    description: "Are you sure this is a typo? ≖w≖",
    category: 'Social',
    package: 'social',
    options: []
}

export async function execute(interaction, client) {
    const user = interaction.user
    const embed = new EmbedBuilder()
        .setTitle(`So sussssspicious ≖w≖ - ${user.username} said`)
        .setDescription("I don't know why but this typo is so sussssspicious (●'◡'●)")
        .setImage("https://i.pinimg.com/originals/0e/85/42/0e854222a3ef5b3a1c53f8c7b7b5f9b5.gif")
        .setFooter({text: `Send at ${displayCurrentTime()}`})
    await interaction.reply({embeds: [embed]})
}