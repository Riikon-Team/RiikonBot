import { EmbedBuilder } from 'discord.js'

//Command configuration
export const config = {
    name: 'avatar',
    description: 'Show avatar of a user',
    category: 'Social',
    package: 'social',
    options: [
        {
            type: 'user',
            name: 'user',
            description: 'Username that you want to get avatar',
            required: true
        }
    ]
}

//Command execution
export async function execute(interaction, client) {
    const targetUser = interaction.options.getUser('user')
    const url = `https://cdn.discordapp.com/avatars/${targetUser.id}/${targetUser.avatar}.png?size=1024`
    const embed = new EmbedBuilder()
        .setTitle("Here is avatar of " + targetUser.username)
        .setImage(url)
        .setDescription(`[Avatar URL](${url})`)
    await interaction.reply({ embeds: [embed] })
}