import { displayCurrentTime } from '../../../utils/commandUtilities.js';
import logger from '../../../utils/logger.js'
import { EmbedBuilder } from 'discord.js'
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

export const config = {
    name: 'sus',
    description: "You feel something so susssssspicious",
    category: 'Social',
    options: []
}

export async function execute(interaction, client) {
    const user = interaction.user
    const embed = new EmbedBuilder()
        .setTitle(`So sussssspicious ≖w≖ - ${user.username} said`)
        .setImage("https://gifdb.com/images/high/mordecai-and-rigby-squinting-suspicious-wqi5u56hxlbd1ps0.gif")
        .setFooter({text: `Send at ${displayCurrentTime()}`})
    await interaction.reply({embeds: [embed]})
}