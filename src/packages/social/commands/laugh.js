import { displayCurrentTime } from '../../../utils/commandUtilities.js';
import { EmbedBuilder } from 'discord.js'

//Just used if asset/laugh not exist
//Just temporary code too
const defaultEmote = ["https://media1.giphy.com/media/PQm9SiQXZh6zoIrWs7/200w.gif?cid=6c09b952l3iad3nfz21372a6l5a2assunycqnho0t4d4twda&ep=v1_gifs_search&rid=200w.gif&ct=g",
    "https://media.tenor.com/8nSbJK3j7EUAAAAM/laugh-anime.gif",
    "https://media3.giphy.com/media/v60KQg3MXLwTS/giphy.gif?cid=6c09b952twoerlkwn4f4o0spgt4cfmgn8iw0cbfc9qlue438&ep=v1_gifs_search&rid=giphy.gif&ct=g"
]

export const config = {
    name: 'laugh',
    description: 'Send a LOL emote',
    category: 'Social',
    package: 'social',
    options: []
}

export async function execute(interaction, client) {
    const user = interaction.user
    const embed = new EmbedBuilder()
        .setTitle(`${user.username} is laughing`)
        .setImage(defaultEmote[Math.floor(Math.random() * defaultEmote.length) ])
        .setFooter({text: `Send at ${displayCurrentTime()}`})

    await interaction.reply({embeds: [embed]})
}