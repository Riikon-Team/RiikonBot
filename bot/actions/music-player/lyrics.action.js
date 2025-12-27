import { iEmbedBuilder } from '../../utils/iEmbedBuilder.js';
import { E } from '../../constants/bot.js';

const MAX_EDIT_DURATION = 10 * 60 * 1000;
const CHECK_INTERVAL = 100;
const DELAY = 0.500;


export const lyricsAction = async (ctx, { query, sync = false }) => {
    const { member, client } = ctx;

    await ctx.defer();

    const player = client.musicPlayers?.get(ctx.guild.id);

    let trackName = null;
    let artistName = null;
    let albumName = null;
    let duration = null;
    let isCurrentTrack = false;


    if (query && query.length > 0) {
        const parts = query.split(' - ');
        trackName = parts[0]?.trim();
        artistName = parts[1]?.trim() || '';
        isCurrentTrack = false;


        if (sync) {
            const embed = new iEmbedBuilder(ctx)
                .setColor('#ff9900')
                .setTitle(`${E.warning} Thông báo`)
                .setDescription('Tính năng đồng bộ lyrics chỉ hoạt động với bài đang phát!\nVui lòng bỏ tên bài hát để xem lyrics đồng bộ của bài hiện tại.');

            return ctx.editReply({ embeds: [embed] });
        }
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
        artistName = currentTrack.artist || (typeof currentTrack.artists === 'string' ? currentTrack.artists : "Unknown");
        albumName = currentTrack.album;
        duration = currentTrack.duration;
        isCurrentTrack = true;
    }

    if (!trackName) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription('Vui lòng cung cấp tên bài hát!');

        return ctx.editReply({ embeds: [embed] });
    }

    try {

        const searchEmbed = new iEmbedBuilder(ctx)
            .setColor('#ffff00')
            .setTitle(`${E.search} Đang tìm lời bài hát...`)
            .setDescription(`Đang tìm: **${trackName}** - ${artistName || 'Unknown'}`);

        await ctx.editReply({ embeds: [searchEmbed] });


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

        if (sync && isCurrentTrack && lyrics.syncedLyrics && lyrics.syncedLyrics.length > 0) {
            if (!player || player.paused || player.audioPlayer.state.status !== 'playing') {
                const embed = new iEmbedBuilder(ctx)
                    .setColor('#ff9900')
                    .setTitle(`${E.warning} Thông báo`)
                    .setDescription('Nhạc cần đang phát để sử dụng tính năng đồng bộ lyrics!\nĐang hiển thị lyrics thường...');

                await ctx.editReply({ embeds: [embed] });


                await new Promise(resolve => setTimeout(resolve, 2000));
                return showStaticLyrics(ctx, lyrics);
            }

            return startSyncedLyrics(ctx, player, lyrics);
        }


        return showStaticLyrics(ctx, lyrics);

    } catch (error) {
        console.error('Lyrics command error:', error);
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi tìm lời bài hát`)
            .setDescription(`\`\`\`${error.message}\`\`\``);

        await ctx.editReply({ embeds: [embed] });
    }
};


async function showStaticLyrics(ctx, lyrics) {
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
            { name: 'Thời lượng', value: lyrics.duration ? formatDuration(lyrics.duration) : 'Unknown', inline: true }
        )
        .setFooter({ text: `Nguồn: ${lyrics.source || 'Unknown'}` });

    await ctx.editReply({ embeds: [lyricsEmbed] });
}

async function startSyncedLyrics(ctx, player, lyrics) {
    const { syncedLyrics, trackName, artistName, albumName, duration } = lyrics;

    const parsedLyrics = parseSyncedLyrics(syncedLyrics.sort((a, b) => a.time - b.time));

    if (parsedLyrics.length === 0) {
        return showStaticLyrics(ctx, lyrics);
    }

    const startTime = Date.now();
    let lastLineIndex = -1;
    let lastRefetchTime = Date.now();
    const REFETCH_INTERVAL = 60000;

    // Measure Discord API latency
    let discordLatency = 0;
    try {
        const pingStart = Date.now();
        const testEmbed = new iEmbedBuilder(ctx)
            .setColor('#00ff00')
            .setTitle(`${E.VinylRecord} ${trackName} (🎵 Live)`)
            .setDescription('📡 Đo ping Discord...');
        await ctx.editReply({ embeds: [testEmbed] });
        discordLatency = (Date.now() - pingStart) / 1000; 
    } catch (error) {
        discordLatency = 0.2;
    }

    // Total offset = base offset + Discord latency
    const EARLY_DISPLAY_OFFSET = DELAY + discordLatency;

    const checkAndUpdate = async () => {
        try {

            if (!player || player.paused || player.audioPlayer.state.status !== 'playing') {
                // console.log('[Lyrics] Player stopped/paused, ending sync');
                clearInterval(checkInterval);
                return;
            }


            const currentTime = player.getCurrentTime() + EARLY_DISPLAY_OFFSET;


            if (Date.now() - startTime > MAX_EDIT_DURATION) {
                // console.log('[Lyrics] Max edit duration reached');
                clearInterval(checkInterval);
                return;
            }

            let currentLineIndex = -1;
            for (let i = 0; i < parsedLyrics.length; i++) {
                if (currentTime >= parsedLyrics[i].time) {
                    currentLineIndex = i;
                } else {
                    break;
                }
            }

            if (currentLineIndex !== lastLineIndex) {
                // console.log(`[Lyrics] ✅ Line changed: ${lastLineIndex} -> ${currentLineIndex} at ${(currentTime - EARLY_DISPLAY_OFFSET).toFixed(2)}s${currentLineIndex >= 0 ? ` (${parsedLyrics[currentLineIndex].text.substring(0, 50)})` : ''}`);
                lastLineIndex = currentLineIndex;
                await performEdit(currentLineIndex, currentTime - EARLY_DISPLAY_OFFSET);
            }

            if (currentLineIndex >= parsedLyrics.length - 1 && currentTime >= parsedLyrics[parsedLyrics.length - 1].time + 5) {
                //  console.log('[Lyrics] Song ended');
                clearInterval(checkInterval);
            }

        } catch (error) {
            console.error('[Lyrics] Check error:', error);
            clearInterval(checkInterval);
        }
    };

    const performEdit = async (currentLineIndex, currentTime) => {
        try {
            // Hiển thị 5 dòng: 2 trước, 1 highlight (giữa), 2 sau
            const displayStartIndex = Math.max(0, currentLineIndex - 2);
            const displayEndIndex = Math.min(parsedLyrics.length - 1, displayStartIndex + 4);

            let displayText = '';

            for (let i = displayStartIndex; i <= displayEndIndex; i++) {
                const line = parsedLyrics[i];

                if (i === currentLineIndex && currentLineIndex >= 0) {
                    displayText += `**▶ ${line.text} **\n`;
                } else {
                    displayText += `  ${line.text}\n`;
                }
            }

            displayText += `\n * ${formatDuration(currentTime)} / ${formatDuration(duration)} * `;


            const embed = new iEmbedBuilder(ctx)
                .setColor('#00ff00')
                .setTitle(`${E.VinylRecord} ${trackName}(🎵 Live)`)
                .setDescription(displayText)
                .addFields(
                    { name: 'Nghệ sĩ', value: artistName || 'Unknown', inline: true },
                    { name: 'Album', value: albumName || 'Unknown', inline: true }
                )
                .setFooter({ text: '🎤 Đang đồng bộ lyrics...' });


            if (Date.now() - lastRefetchTime > REFETCH_INTERVAL) {
                try {
                    if (ctx.isInteraction) {
                        await ctx.source.fetchReply();
                    }
                    lastRefetchTime = Date.now();
                } catch (error) {
                    console.error('[Lyrics] Error refetching message:', error);
                }
            }


            try {
                await ctx.editReply({ embeds: [embed] });
            } catch (error) {

                if (error.code === 10008 || error.code === 50027) {
                    console.log('[Lyrics] Message edit failed, stopping sync');
                    clearInterval(checkInterval);
                    return;
                }

                console.error('[Lyrics] Edit error:', error.message);
            }

        } catch (error) {
            console.error('[Lyrics] Perform edit error:', error);
        }
    };


    // Initial display - show first 5 lines without highlight
    let initialText = '';
    const initialLineCount = Math.min(5, parsedLyrics.length);
    for (let i = 0; i < initialLineCount; i++) {
        initialText += `  ${parsedLyrics[i].text}\n`;
    }
    initialText += '\n*⏳ Đang chờ lyrics bắt đầu...*';

    const initialEmbed = new iEmbedBuilder(ctx)
        .setColor('#00ff00')
        .setTitle(`${E.VinylRecord} ${trackName}(🎵 Live)`)
        .setDescription(initialText)
        .addFields(
            { name: 'Nghệ sĩ', value: artistName || 'Unknown', inline: true },
            { name: 'Album', value: albumName || 'Unknown', inline: true }
        )
        .setFooter({ text: '🎤 Đang đồng bộ lyrics...' });

    await ctx.editReply({ embeds: [initialEmbed] });


    const checkInterval = setInterval(checkAndUpdate, CHECK_INTERVAL);


    setTimeout(() => {
        clearInterval(checkInterval);
        console.log('[Lyrics] Auto-stopped after max duration');
    }, MAX_EDIT_DURATION);
}


function parseSyncedLyrics(syncedLyrics) {
    const parsed = [];

    try {
        if (Array.isArray(syncedLyrics)) {

            for (const line of syncedLyrics) {
                if (line.time !== undefined && line.text) {
                    let time = parseFloat(line.time);

                    // Convert milliseconds to seconds if needed
                    if (time > 1000) {
                        time = time / 1000;
                    }

                    parsed.push({
                        time: time,
                        text: line.text.trim()
                    });
                }
            }
        } else if (typeof syncedLyrics === 'string') {

            const lines = syncedLyrics.split('\n');
            const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

            for (const line of lines) {
                const match = line.match(timeRegex);
                if (match) {
                    const minutes = parseInt(match[1]);
                    const seconds = parseInt(match[2]);
                    const milliseconds = parseInt(match[3].padEnd(3, '0'));
                    const text = match[4].trim();

                    if (text) {
                        parsed.push({
                            time: minutes * 60 + seconds + milliseconds / 1000,
                            text
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.error('[Lyrics] Parse error:', error);
    }

    const sorted = parsed.sort((a, b) => a.time - b.time);

    return sorted;
}


function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}: ${secs.toString().padStart(2, '0')}`;
}
