import { EmbedBuilder } from 'discord.js'

//Command configuration
export const config = {
    name: 'avatar_decoration',
    description: 'Get avatar decoration of a user',
    category: 'Social',
    package: 'social',
    options: [
        {
            type: 'user',
            name: 'user',
            description: 'User that you want to get avatar decoration',
            required: true
        }
    ]
}

//Command execution
export async function execute(interaction, client) {
    const targetUser = interaction.options.getUser('user')
    const avatarDecorationData = targetUser.avatarDecorationData
    const embed = new EmbedBuilder()
    if (avatarDecorationData == null) {
        await interaction.reply(`**${targetUser.username}** has not used any avatar decoration.`)
    }
    else {
        const url = `https://cdn.discordapp.com/avatar-decoration-presets/${avatarDecorationData.asset}.png?size=256`
        embed.setTitle("Here is avatar decoration of " + targetUser.username)
            .setImage(url)
            .setDescription(`[Click to see animation for this avatar decoration](${url})`)
        await interaction.reply({ embeds: [embed] })
    }
}