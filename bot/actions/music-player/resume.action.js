import { iEmbedBuilder } from '../../utils/iEmbedBuilder.js';
import { E } from '../../constants/bot.js';

export const resumeAction = async (ctx) => {
    const { client, member } = ctx;
    const player = client.musicPlayers?.get(ctx.guild.id);

    if (!member?.voice?.channel) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle( `${E.error} Lỗi`)
            .setDescription('Bạn cần vào kênh voice để sử dụng lệnh này!');

        return ctx.editReply({ embeds: [embed] });
    }

    if (!player || !player.getCurrentTrack()) {
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
                .setDescription('Không có bài hát nào đang tạm dừng!');

            return ctx.editReply({ embeds: [embed] });
        }

        try {
            if (player.resume()) {
                const embed = new iEmbedBuilder(ctx)
                    .setColor('#00ff00')
                    .setTitle(`${E.Resume} Tiếp tục phát`)
                    .setDescription(`**${player.getCurrentTrack().title}**`);

                await ctx.editReply({ embeds: [embed] });
            } else {
                const embed = new iEmbedBuilder(ctx)
                    .setColor('#ff0000')
                    .setTitle(`${E.error} Lỗi`)
                    .setDescription('Nhạc đang phát rồi!');

                await ctx.editReply({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Resume command error:', error);
            const embed = new iEmbedBuilder(ctx)
                .setColor('#ff0000')
                .setTitle(`${E.error} Lỗi`)
                .setDescription(`\`\`\`${error.message}\`\`\``);

            await ctx.editReply({ embeds: [embed] });
        }
    }
};