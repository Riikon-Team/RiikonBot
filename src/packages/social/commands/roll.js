//Command configuration
export const config = {
    name: 'roll',
    description: 'Just a roll, start from 1 to 100 :D',
    category: 'Social',
    package: 'social',
    options: [
        {
            type: 'number',
            name: 'max',
            description: 'Max value of this roll',
        }
    ]
}

//Command execution
export async function execute(interaction, client) {
    const user = interaction.user
    const maxValue = interaction.options.getInteger("max")
    const value = Math.floor(Math.random() * (maxValue ? maxValue : 100)) + 1
    await interaction.reply(`${user.username} got ${value} points`)
}