import { iEmbedBuilder } from '../../utils/iEmbedBuilder.js';
import { ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { SEARCH_RESULTS_LIMIT } from '../../constants/music.js';
import MusicPlayer from '../../services/MusicPlayer.js';
import { E } from '../../constants/bot.js';

export const searchAction = async (ctx, { query }) => {
    const { client, member } = ctx;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription('Bạn cần vào một kênh voice để sử dụng lệnh này!');

        return ctx.reply({ embeds: [embed] });
    }

    if (!query) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription('Vui lòng nhập từ khóa tìm kiếm!');

        return ctx.reply({ embeds: [embed] });
    }

    try {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ffff00')
            .setTitle(`${E.search} Đang tìm kiếm...`)
            .setDescription(`Đang tìm kiếm: **${query}**`);

        await ctx.reply({ embeds: [embed] });

        let player = client.musicPlayers?.get(ctx.guild.id);
        if (!player) {
            player = new MusicPlayer(ctx.guild, ctx.channel, voiceChannel);
            if (!client.musicPlayers) {
                client.musicPlayers = new Map();
            }
            client.musicPlayers.set(ctx.guild.id, player);
        }

        const results = await player.riknClient.searchSong(query);

        if (!results || results.length === 0) {
            const embed = new iEmbedBuilder(ctx)
                .setColor('#ff0000')
                .setTitle(`${E.error} Không tìm thấy`)
                .setDescription('Không tìm thấy bài hát nào!');

            return ctx.reply({ embeds: [embed] });
        }

        const options = results.slice(0, 20).map((track, index) => {
            const artist = track.artist || (typeof track.artists === 'string' ? track.artists : 'Unknown');
            return {
                label: track.title.substring(0, 100),
                description: `${artist.substring(0, 50)} • ${player.formatDuration(track.duration)}`.substring(0, 100),
                value: index.toString(),
                emoji: player.getPlatformEmoji(track.platform)
            };
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`music_search_${ctx.id}`)
            .setPlaceholder('Chọn bài hát để phát')
            .addOptions(options)
            .setMinValues(1)
            .setMaxValues(1);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        let description = '';
        results.slice(0, 10).forEach((track, index) => {
            const artist = track.artist || (typeof track.artists === 'string' ? track.artists : 'Unknown');
            description += `**${index + 1}.** ${track.title}\n`;
            description += `   ${player.getPlatformEmoji(track.platform)} ${artist} • ${player.formatDuration(track.duration)}\n\n`;
        });

        const resultEmbed = new iEmbedBuilder(ctx)
            .setColor('#0099ff')
            .setTitle(`${E.search} Kết quả tìm kiếm`)
            .setDescription(description)
            .setFooter({ text: `Tìm thấy ${results.length} kết quả • Chọn bài hát từ menu bên dưới` });

        await ctx.reply({
            embeds: [resultEmbed],
            components: [row]
        });

        if (!client.musicSearchResults) {
            client.musicSearchResults = new Map();
        }
        client.musicSearchResults.set(`music_search_${ctx.id}`, {
            results,
            userId: member.id,
            player,
            voiceChannel,
            textChannel: ctx.channel,
            expiresAt: Date.now() + 60000
        });

        setTimeout(() => {
            client.musicSearchResults?.delete(`music_search_${ctx.id}`);
        }, 60000);

    } catch (error) {
        console.error('Search command error:', error);
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi tìm kiếm`)
            .setDescription(`\`\`\`${error.message}\`\`\``);

        await ctx.reply({ embeds: [embed], components: [] });
    }
}