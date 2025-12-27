import { iEmbedBuilder } from '../../utils/iEmbedBuilder.js';
import { E } from '../../constants/bot.js';

export const nowPlayingAction = async (ctx) => {
    const { client } = ctx;
    const player = client.musicPlayers?.get(ctx.guild.id);

    if (!player || !player.getCurrentTrack()) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Không có bài hát nào đang phát`)
            .setDescription('Sử dụng lệnh `play` để bắt đầu phát nhạc!');

        return ctx.reply({ embeds: [embed] });
    }

    const song = player.getCurrentTrack();
    const currentTime = Math.floor(player.getCurrentTime());
    const duration = song.duration;
    const progress = Math.min(Math.floor((currentTime / duration) * 20), 20);

    // Create progress bar
    const progressBar = `${'━'.repeat(progress)}●${'—'.repeat(Math.max(0, 20 - progress))}`;

    const queueInfo = player.getQueue();

    const artist = song.artist || (typeof song.artists === 'string' ? song.artists : 'Unknown');

    const embed = new iEmbedBuilder(ctx)
        .setColor('#0099ff')
        .setTitle(player.paused ? `${E.Pause} Đã tạm dừng` : `${E.Resume} Đang phát`)
        .setDescription(`**[${song.title}](${song.url})**`)
        .addFields(
            { name: 'Nghệ sĩ', value: artist, inline: true },
            { name: 'Album', value: song.album || 'Unknown', inline: true },
            { name: 'Thời lượng', value: player.formatDuration(duration), inline: true },
            {
                name: 'Tiến độ',
                value: `${player.formatDuration(currentTime)} ${progressBar} ${player.formatDuration(duration)}`,
                inline: false
            },
            { name: 'Âm lượng', value: `${player.volume}%`, inline: true },
            { name: 'Lặp lại', value: player.loop ? E.switchon : E.switchoff, inline: true },
            { name: 'Trong hàng đợi', value: `${queueInfo.total} bài`, inline: true },
            { name: 'Nền tảng', value: `${E[song.platform.toUpperCase()]} ${song.platform.toUpperCase()}`, inline: true },
            { name: 'Yêu cầu bởi', value: song.requestedBy?.user?.tag || 'Unknown', inline: true },
            { name: 'Đã thêm', value: `<t:${Math.floor(song.addedAt / 1000)}:R>`, inline: true }
        )
        .setThumbnail(song.thumbnail)
        .setTimestamp();

    if (queueInfo.upcoming && queueInfo.upcoming.length > 0) {
        const nextSong = queueInfo.upcoming[0];
        const artist = nextSong.artist || (typeof nextSong.artists === 'string' ? nextSong.artists : 'Unknown');
        embed.addFields({
            name: '⏭ Tiếp theo',
            value: `**${nextSong.title}** - ${artist}`,
            inline: false
        });
    }

    await ctx.reply({ embeds: [embed] });
}