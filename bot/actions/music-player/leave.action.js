import { iEmbedBuilder } from '../../utils/iEmbedBuilder.js';
import { E } from '../../constants/bot.js';

export const leaveAction = async (ctx) => {
    const { member, client } = ctx;
    const player = client.musicPlayers?.get(ctx.guild.id);

    if (!member?.voice?.channel) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription('Bạn cần vào kênh voice để sử dụng lệnh này!');

        return ctx.reply({ embeds: [embed] });
    }

    if (!player || !player.connection) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription('Bot không kết nối với kênh voice nào!');

        return ctx.reply({ embeds: [embed] });
    }

    try {
        const queueSize = player.getQueue().total;
        const cleared = player.clearQueue();
        player.stop();

        // Remove player from collection
        client.musicPlayers?.delete(ctx.guild.id);

        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.exit} Đã rời khỏi kênh voice`)
            .setDescription("Bot đã rời khỏi kênh voice")
            .addFields({
                name: ` ${E.trash} Đã xóa hàng đợi`,
                value: `${cleared} bài hát`,
                inline: true
            });

        await ctx.editReply({ embeds: [embed] });
    } catch (error) {
        console.error('Leave command error:', error);
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription(`\`\`\`${error.message}\`\`\``);

        await ctx.editReply({ embeds: [embed] });
    }
};