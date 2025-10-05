import { iEmbedBuilder } from '../../utils/iEmbedBuilder.js';
import { E } from '../../constants/bot.js';

export const lyricsAction = async (ctx, { query }) => {
    const { member, client } = ctx;
    
    await ctx.defer();
    
    const player = client.musicPlayers?.get(ctx.guild.id);

    let trackName = null;
    let artistName = null;
    let albumName = null;
    let duration = null;    if (query && query.length > 0) {
        const parts = query.split(' - ');
        trackName = parts[0]?.trim();
        artistName = parts[1]?.trim() || '';
    } else {
        const currentTrack = player?.getCurrentTrack();
        
        if (!player || !currentTrack) {
            const embed = new iEmbedBuilder(ctx)
                .setColor('#ff0000')
                .setTitle(`${E.error} Lỗi`)
                .setDescription('Không có bài hát nào đang phát! Vui lòng cung cấp tên bài hát.\nVí dụ: `lyrics <tên bài hát> - <tên nghệ sĩ>`');

            return ctx.editReply({ embeds: [embed] });
        }

        trackName = currentTrack.title;
        artistName = currentTrack.artist;
        albumName = currentTrack.album;
        duration = currentTrack.duration;
    }

    if (!trackName) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription('Vui lòng cung cấp tên bài hát!');

        return ctx.editReply({ embeds: [embed] });
    }

    try {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ffff00')
            .setTitle(`${E.search} Đang tìm lời bài hát...`)
            .setDescription(`Đang tìm: **${trackName}** - ${artistName || 'Unknown'}`);

        await ctx.editReply({ embeds: [embed] });

        const lyrics = await player.getLyrics(trackName, artistName, albumName, duration);

        if (!lyrics || !lyrics.plainLyrics || lyrics.plainLyrics.length === 0) {
            const notFoundEmbed = new iEmbedBuilder(ctx)
                .setColor('#ff0000')
                .setTitle(`${E.error} Không tìm thấy lời bài hát`)
                .setDescription(`Không tìm thấy lời cho: **${trackName}** - ${artistName}`)
                .addFields({
                    name: '💡 Gợi ý',
                    value: 'Thử tìm kiếm với tên khác hoặc kiểm tra chính tả',
                    inline: false
                });

            return ctx.editReply({ embeds: [notFoundEmbed] });
        }

        let lyricsText = Array.isArray(lyrics.plainLyrics) 
            ? lyrics.plainLyrics.join('\n') 
            : lyrics.plainLyrics;
        
        if (lyricsText.length > 4000) {
            lyricsText = `${lyricsText.substring(0, 3997)}...`;
        }

        const lyricsEmbed = new iEmbedBuilder(ctx)
            .setColor('#00ff00')
            .setTitle(`${E.VinylRecord} ${lyrics.trackName || lyrics.name}`)
            .setDescription(lyricsText)
            .addFields(
                { name: 'Nghệ sĩ', value: lyrics.artistName || 'Unknown', inline: true },
                { name: 'Album', value: lyrics.albumName || 'Unknown', inline: true },
                { name: 'Thời lượng', value: lyrics.duration ? `${Math.floor(lyrics.duration / 60)}:${(lyrics.duration % 60).toString().padStart(2, '0')}` : 'Unknown', inline: true }
            )
            .setFooter({ text: `Nguồn: ${lyrics.source || 'Unknown'}` });

        // Synced lyrics feature has been removed - just show plain lyrics
        await ctx.editReply({ embeds: [lyricsEmbed] });

    } catch (error) {
        console.error('Lyrics command error:', error);
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi tìm lời bài hát`)
            .setDescription(`\`\`\`${error.message}\`\`\``);

        await ctx.editReply({ embeds: [embed] });
    }
}