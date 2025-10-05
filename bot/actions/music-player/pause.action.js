import { iEmbedBuilder } from '../../utils/iEmbedBuilder.js';
import { E } from '../../constants/bot.js';

export const pauseAction = async (ctx) => {
    const { member, client } = ctx;

    const player = client.musicPlayers?.get(ctx.guild.id);

    if (!member?.voice?.channel) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription('Bạn cần vào kênh voice để sử dụng lệnh này!');

        return ctx.reply({ embeds: [embed] });
    }

    if (!player || !player.getCurrentTrack()) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription('Không có bài hát nào đang phát!');

        return ctx.reply({ embeds: [embed] });
    }

    try {
        if (player.pause()) {
            const embed = new iEmbedBuilder(ctx)
                .setColor('#ffff00')
                .setTitle(`${E.Pause} Đã tạm dừng`)
                .setDescription(`**${player.getCurrentTrack().title}**`);

            await ctx.reply({ embeds: [embed] });
        } else {
            const embed = new iEmbedBuilder(ctx)
                .setColor('#ff0000')
                .setTitle(`${E.error} Lỗi`)
                .setDescription('Nhạc đã tạm dừng rồi!');

            await ctx.reply({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Pause command error:', error);
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription(`\`\`\`${error.message}\`\`\``);

        await ctx.reply({ embeds: [embed] });
    }
};