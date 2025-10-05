import { EmbedBuilder } from 'discord.js';

export class ReplyBuilder {
    static success(title, description, fields = []) {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle(`✅ ${title}`)
            .setDescription(description)
            .setTimestamp();

        if (fields.length > 0) {
            embed.addFields(fields);
        }

        return embed;
    }

    static error(title, description) {
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`❌ ${title}`)
            .setDescription(description)
            .setTimestamp();

        return embed;
    }

    static info(title, description, fields = []) {
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(title)
            .setDescription(description)
            .setTimestamp();

        if (fields.length > 0) {
            embed.addFields(fields);
        }

        return embed;
    }
}