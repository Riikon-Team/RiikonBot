import { iEmbedBuilder } from '../../utils/iEmbedBuilder.js';
import { E } from '../../constants/bot.js';

export const previousAction = async (ctx, { count = 1 }) => {
    const { member, client } = ctx;

    const player = client.musicPlayers?.get(ctx.guild.id);

    if (!member?.voice?.channel) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription('Bạn cần vào kênh voice để sử dụng lệnh này!');

        return ctx.editReply({ embeds: [embed] });
    }

    if (!player || !player.getCurrentTrack()) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription('Không có bài hát nào đang phát!');

        return ctx.editReply({ embeds: [embed] });
    }

    try {
        if (count < 1) {
            const embed = new iEmbedBuilder(ctx)
                .setColor('#ff0000')
                .setTitle(`${E.error} Lỗi`)
                .setDescription('Số bài phải lớn hơn 0!');

            return ctx.editReply({ embeds: [embed] });
        }

        if (await player.previous(count)) {
            const embed = new iEmbedBuilder(ctx)
                .setColor('#00ff00')
                .setTitle('⏮ Đã quay lại')
                .setDescription(`Đã lùi ${count} bài`);

            await ctx.editReply({ embeds: [embed] });
        } else {
            const embed = new iEmbedBuilder(ctx)
                .setColor('#ff0000')
                .setTitle(`${E.error} Lỗi`)
                .setDescription('Không thể lùi bài! Đã ở đầu danh sách.');

            await ctx.editReply({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Previous command error:', error);
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription(`\`\`\`${error.message}\`\`\``);

        await ctx.editReply({ embeds: [embed] });
    }
};