import { iEmbedBuilder } from '../../utils/iEmbedBuilder.js';
import { E } from '../../constants/bot.js';

export const removeAction = async (ctx, { position }) => {
    const { client } = ctx;
    const player = client.musicPlayers?.get(ctx.guild.id);
    const member = ctx.member;

    if (!member?.voice?.channel) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription('Bạn cần vào kênh voice để sử dụng lệnh này!');

        return ctx.editReply({ embeds: [embed] });
    }

    if (!player || player.getQueue().total === 0) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Hàng đợi trống`)
            .setDescription('Không có bài hát nào trong hàng đợi!');

        return ctx.editReply({ embeds: [embed] });
    }

    if (!position || Number.isNaN(position) || position < 1) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription('Vui lòng nhập số thứ tự hợp lệ!\nSử dụng `queue` để xem danh sách');

        return ctx.editReply({ embeds: [embed] });
    }

    try {
        const index = position - 1;
        const removed = player.removeTrack(index);

        if (removed) {
            const artist = removed.artist || (typeof removed.artists === 'string' ? removed.artists : 'Unknown');
            const embed = new iEmbedBuilder(ctx)
                .setColor('#00ff00')
                .setTitle(`${E.success} Đã xóa`)
                .setDescription(`Đã xóa: **${removed.title}**`)
                .addFields(
                    { name: 'Nghệ sĩ', value: artist, inline: true },
                    { name: 'Thời lượng', value: player.formatDuration(removed.duration), inline: true }
                );

            await ctx.editReply({ embeds: [embed] });
        } else {
            const embed = new iEmbedBuilder(ctx)
                .setColor('#ff0000')
                .setTitle(`${E.error} Lỗi`)
                .setDescription(`Không tìm thấy bài hát ở vị trí ${position}!`);

            await ctx.editReply({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Remove command error:', error);
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription(`\`\`\`${error.message}\`\`\``);

        await ctx.editReply({ embeds: [embed] });
    }
}