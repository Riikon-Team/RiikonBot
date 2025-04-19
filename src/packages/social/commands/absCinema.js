import { displayCurrentTime } from '../../../utils/commandUtilities.js';
import { EmbedBuilder } from 'discord.js'

//Just temporary code too
const image = "https://blog.coccoc.com/wp-content/uploads/2025/04/1-dinh-nghia-absolute-cinema-1200x675.jpg"

export const config = {
    name: 'abs_cinema',
    description: 'Absolute Cinema ✋🤯🤚 ',
    category: 'Meme',
    options: [
        {
            type: 'string',
            name: 'message',
            description: 'What thing make you feel absolute cinema',
            required: false
        }
    ]
}

export async function execute(interaction, client) {
    const user = interaction.user
    const message = interaction.options.getString("message")
    const embedMessage = message ? `${message}. _***ABSOLUTE CINEMA***_` : "Nothing more _***ABSOLUTE CINEMA***_ than this thing"
    const embed = new EmbedBuilder()
        .setDescription(`${user.username}'s vibe right now? ${embedMessage} :raised_hand: :exploding_head: :raised_back_of_hand:`)
        .setImage(image)
        .setFooter({text: `Send at ${displayCurrentTime()}`})

    await interaction.reply({embeds: [embed]})
}