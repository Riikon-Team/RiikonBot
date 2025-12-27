import { iEmbedBuilder } from '../../utils/iEmbedBuilder.js';
import MusicPlayer from '../../services/MusicPlayer.js'; 
import { E } from '../../constants/bot.js';

export const playAction = async (ctx, {query, addFirst=false} ) => {
    const { member, client } = ctx;

    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription('Bạn cần vào một kênh voice để sử dụng lệnh này!');

        return ctx.editReply({ embeds: [embed] });
    }

    if (!query) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription('Vui lòng nhập tên bài hát hoặc URL!');

        return ctx.editReply({ embeds: [embed] });
    }

    try {
        let player = client.musicPlayers?.get(ctx.guild.id);
        if (!player) {
            
            player = new MusicPlayer(ctx.guild, ctx.channel, voiceChannel);
            if (!client.musicPlayers) {
                client.musicPlayers = new Map();
            }
            client.musicPlayers.set(ctx.guild.id, player);
        }

        player.textChannel = ctx.channel;
        player.voiceChannel = voiceChannel;

        const embed = new iEmbedBuilder(ctx)
            .setColor('#ffff00')
            .setTitle(`${E.search} Đang tìm kiếm...`)
            .setDescription(`Đang tìm kiếm: **${query}**`);

        await ctx.editReply({ embeds: [embed] });

        const result = addFirst
            ? await player.addTracksFirst(query, member)
            : await player.addTracks(query, member);

        const wasPlaying = player.audioPlayer.state.status === 'playing' || player.audioPlayer.state.status === 'buffering';

        if (!wasPlaying) {
            const track = await player.play();
            const artist = track.artist || (typeof track.artists === 'string' ? track.artists : 'Unknown');
            const playEmbed = new iEmbedBuilder(ctx)
                .setColor('#00ff00')
                .setTitle(`${E["21362bocchitherock"]} Bắt đầu phát`)
                .setDescription(`**[${track.title}](${track.url})**`)
                .addFields(
                    { name: 'Nghệ sĩ', value: artist, inline: true },
                    { name: 'Thời lượng', value: player.formatDuration(track.duration), inline: true },
                    { name: 'Nền tảng', value: E[track.platform.toLowerCase()], inline: true }
                )
                .setThumbnail(track.thumbnail)
                .setFooter({ text: `Yêu cầu bởi ${member.user.tag}`, iconURL: member.user.displayAvatarURL() });

            if (result.tracks.length > 1) {
                playEmbed.addFields({
                    name: `${E.add} Đã thêm playlist`,
                    value: `${result.tracks.length} bài hát vào hàng đợi`,
                    inline: false
                });
            }

            await ctx.editReply({ embeds: [playEmbed] });
        } else {
            const addedEmbed = new iEmbedBuilder(ctx)
                .setColor('#00ff00')
                .setTitle(result.isPlaylist ? `${E.add} Đã thêm playlist` : `${E.success} Đã thêm vào hàng đợi`)
                .setDescription(
                    result.isPlaylist
                        ? `Đã thêm **${result.tracks.length}** bài hát vào hàng đợi`
                        : `**[${result.tracks[0].title}](${result.tracks[0].url})**`
                )
                .setFooter({ text: addFirst ? 'Đã thêm lên đầu hàng đợi' : 'Đã thêm vào cuối hàng đợi' });

            if (!result.isPlaylist && result.tracks[0]) {
                const artist = result.tracks[0].artist || (typeof result.tracks[0].artists === 'string' ? result.tracks[0].artists : 'Unknown');
                addedEmbed.addFields(
                    { name: 'Nghệ sĩ', value: artist, inline: true },
                    { name: 'Thời lượng', value: player.formatDuration(result.tracks[0].duration), inline: true }
                );
                addedEmbed.setThumbnail(result.tracks[0].thumbnail);
            }

            await ctx.editReply({ embeds: [addedEmbed] });
        }

    } catch (error) {
        console.error('Play command error:', error);
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi phát nhạc`)
            .setDescription(`\`\`\`${error.message}\`\`\``);

        await ctx.editReply({ embeds: [embed] });
    }
}