import { iEmbedBuilder } from '../../utils/iEmbedBuilder.js';
import { E } from '../../constants/bot.js';

export const loopAction = async (ctx) => {
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
        const newLoop = player.setLoop(!player.loop);

        const embed = new iEmbedBuilder(ctx)
            .setColor(newLoop ? '#00ff00' : '#808080')
            .setTitle(newLoop ? `${E.switchon} Lặp lại bài hát` : `${E.switchoff} Tắt lặp lại`)
            .setDescription(newLoop ? `Sẽ lặp lại: **${player.getCurrentTrack().title}**` : 'Chế độ lặp lại đã tắt');

        await ctx.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Loop command error:', error);
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription(`\`\`\`${error.message}\`\`\``);

        await ctx.reply({ embeds: [embed] });
    }
};