import { iEmbedBuilder } from '../../utils/iEmbedBuilder.js';
import { E } from '../../constants/bot.js';

export const shuffleAction = async (ctx) => {
    const { client, member } = ctx;
    const player = client.musicPlayers?.get(ctx.guild.id);

    if (!member?.voice?.channel) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription('Bạn cần vào kênh voice để sử dụng lệnh này!');

        return ctx.reply({ embeds: [embed] });
    }

    if (!player || player.getQueue().total < 2) {
        if (!member?.voice?.channel) {
            const embed = new iEmbedBuilder(ctx)
                .setColor('#ff0000')
                .setTitle(`${E.error} Lỗi`)
                .setDescription('Bạn cần vào kênh voice để sử dụng lệnh này!');

            return ctx.reply({ embeds: [embed] });
        }

        if (!player || player.getQueue().total < 2) {
            const embed = new iEmbedBuilder(ctx)
                .setColor('#ff0000')
                .setTitle(`${E.error} Lỗi`)
                .setDescription('Cần ít nhất 2 bài trong hàng đợi để xáo trộn!');

            return ctx.reply({ embeds: [embed] });
        }

        try {
            if (player.shuffleQueue()) {
                const embed = new iEmbedBuilder(ctx)
                    .setColor('#00ff00')
                    .setTitle(`${E.success} Đã xáo trộn`)
                    .setDescription(`Đã xáo trộn hàng đợi với ${player.getQueue().total} bài hát`);

                await ctx.reply({ embeds: [embed] });
            } else {
                const embed = new iEmbedBuilder(ctx)
                    .setColor('#ff0000')
                    .setTitle(`${E.error} Lỗi`)
                    .setDescription('Không thể xáo trộn hàng đợi!');

                await ctx.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Shuffle command error:', error);
            const embed = new iEmbedBuilder(ctx)
                .setColor('#ff0000')
                .setTitle(`${E.error} Lỗi`)
                .setDescription(`\`\`\`${error.message}\`\`\``);

            await ctx.reply({ embeds: [embed] });
        }
    }
};