import { iEmbedBuilder } from '../../utils/iEmbedBuilder.js';
import { QUEUE_PAGE_SIZE } from '../../constants/music.js';
import { E } from '../../constants/bot.js';

export const queueAction = async (ctx, { page }) => {
    const { client } = ctx;

    const player = client.musicPlayers?.get(ctx.guild.id);

    if (!player) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Hàng đợi trống`)
            .setDescription('Không có bài hát nào trong hàng đợi!');

        return ctx.editReply({ embeds: [embed] });
    }

    const queueInfo = player.getQueue();

    if (!queueInfo.current && queueInfo.queue.length === 0) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Hàng đợi trống`)
            .setDescription('Không có bài hát nào trong hàng đợi!');

        return ctx.editReply({ embeds: [embed] });
    }

    const totalPages = Math.ceil(queueInfo.queue.length / QUEUE_PAGE_SIZE);

    if (page > totalPages && totalPages > 0) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription(`Trang ${page} không tồn tại! Tổng số trang: ${totalPages}`);

        return ctx.editReply({ embeds: [embed] });
    }

    const start = (page - 1) * QUEUE_PAGE_SIZE;
    const end = start + QUEUE_PAGE_SIZE;
    const songsToShow = queueInfo.queue.slice(start, end);

    let queueDescription = '';

    songsToShow.forEach((song, index) => {
        const position = start + index + 1;
        const isCurrent = position - 1 === queueInfo.currentIndex;
        const emoji = isCurrent ? E.MusicBeat : `\`${position}.\``;
        const duration = player.formatDuration(song.duration);
        const requester = song.requestedBy?.user?.tag || 'Unknown';

        queueDescription += `${emoji} **${song.title}**\n`;
        queueDescription += `   ${player.getPlatformEmoji(song.platform)} ${song.artist} • ${duration} • ${requester}\n\n`;
    });

    const currentSong = queueInfo.current;
    const totalDuration = queueInfo.queue.reduce((total, song) => total + (song.duration || 0), 0);

    const embed = new iEmbedBuilder(ctx)
        .setColor('#0099ff')
        .setTitle(`${E.VinylRecord} Hàng đợi nhạc`)
        .setDescription(queueDescription || 'Không có bài hát nào')
        .setFooter({ text: `Trang ${page}/${totalPages || 1} • Sử dụng "queue <số>" để xem trang khác` });

    if (currentSong) {
        embed.addFields({
            name: `${E.MusicBeat} Đang phát`,
            value: `**${currentSong.title}** - ${currentSong.artist}\n${player.getPlatformEmoji(currentSong.platform)} ${player.formatDuration(currentSong.duration)}`,
            inline: false
        });
        embed.setThumbnail(currentSong.thumbnail);
    }

    embed.addFields(
        { name: 'Tổng số', value: `${queueInfo.total} bài`, inline: true },
        { name: 'Tổng thời lượng', value: player.formatDuration(totalDuration), inline: true },
        { name: 'Âm lượng', value: `${player.volume}%`, inline: true }
    );

    await ctx.editReply({ embeds: [embed] });
}