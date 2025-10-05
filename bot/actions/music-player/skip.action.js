import { iEmbedBuilder } from '../../utils/iEmbedBuilder.js';
import { E } from '../../constants/bot.js';

export const skipAction = async (ctx, { count = 1}) => {
    const { member, client } = ctx;
    
    await ctx.defer();
    
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

        const currentTrack = player.getCurrentTrack();
        const queueLength = player.queue.length;

        if (await player.skip(count)) {
            let description;
            if (count >= queueLength) {
                description = "Đã dừng phát và xóa hàng đợi.";
            } else {
                description = `Đã bỏ qua ${count} bài từ: **${currentTrack.title}**`;
            }
            
            const embed = new iEmbedBuilder(ctx)
                .setColor('#00ff00')
                .setTitle(`${E.success} Đã chuyển bài`)
                .setDescription(description);

            await ctx.editReply({ embeds: [embed] });
        } else {
            const embed = new iEmbedBuilder(ctx)
                .setColor('#ff0000')
                .setTitle(`${E.error} Lỗi`)
                .setDescription('Không thể skip!');

            await ctx.editReply({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Skip command error:', error);
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription(`\`\`\`${error.message}\`\`\``);

        await ctx.editReply({ embeds: [embed] });
    }
};