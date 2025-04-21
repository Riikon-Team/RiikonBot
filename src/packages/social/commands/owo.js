export const config = {
    name: 'owo',
    description: "Don't know what to say? Just OwO",
    category: 'Social',
    package: 'social',
    options: []
}

export async function execute(interaction, client) {
    const user = interaction.user
    await interaction.reply(`**${user.username}** send an OwO`)
}