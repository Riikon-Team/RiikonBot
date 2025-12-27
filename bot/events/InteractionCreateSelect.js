import { Events, EmbedBuilder } from 'discord.js';
import { E } from '../constants/bot.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isStringSelectMenu()) return;

        if (interaction.customId.startsWith('music_search_')) {
            await handleMusicSearchSelect(interaction);
            return;
        }

    }
};

async function handleMusicSearchSelect(interaction) {
    const client = interaction.client;
    const searchData = client.musicSearchResults?.get(interaction.customId);

    if (!searchData) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle(`${E.error} Hết hạn`)
            .setDescription('Kết quả tìm kiếm đã hết hạn. Vui lòng tìm kiếm lại!');
        
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.user.id !== searchData.userId) {
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle(`${E.error} Không có quyền`)
            .setDescription('Chỉ người yêu cầu tìm kiếm mới có thể chọn!');
        
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    await interaction.deferReply();

    try {
        const selectedIndex = Number.parseInt(interaction.values[0], 10);
        const selectedTrack = searchData.results[selectedIndex];

        if (!selectedTrack) {
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle(`${E.error} Lỗi`)
                .setDescription('Bài hát không hợp lệ!');
            
            return interaction.editReply({ embeds: [embed] });
        }

        const player = searchData.player;
        player.textChannel = searchData.textChannel;
        player.voiceChannel = searchData.voiceChannel;

        const wasPlaying = player.currentTrack !== null;
        
        selectedTrack.requestedBy = interaction.member;
        selectedTrack.addedAt = Date.now();
        player.queue.push(selectedTrack);

        if (!wasPlaying) {
            const track = await player.play();
            const artist = track.artist || (typeof track.artists === 'string' ? track.artists : 'Unknown');
            
            const playEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🎵 Bắt đầu phát')
                .setDescription(`**[${track.title}](${track.url})**`)
                .addFields(
                    { name: 'Nghệ sĩ', value: artist, inline: true },
                    { name: 'Thời lượng', value: player.formatDuration(track.duration), inline: true },
                    { name: 'Nền tảng', value: `${E[track.platform.toLowerCase()]}`, inline: true }
                )
                .setThumbnail(track.images?.[0]?.url || null)
                .setFooter({ text: `Yêu cầu bởi ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

            await interaction.editReply({ embeds: [playEmbed] });
        } else {
            const artist = selectedTrack.artist || (typeof selectedTrack.artists === 'string' ? selectedTrack.artists : 'Unknown');
            const addedEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(`${E.success} Đã thêm vào hàng đợi`)
                .setDescription(`**[${selectedTrack.title}](${selectedTrack.url})**`)
                .addFields(
                    { name: 'Nghệ sĩ', value: artist, inline: true },
                    { name: 'Thời lượng', value: player.formatDuration(selectedTrack.duration), inline: true },
                    { name: 'Vị trí', value: `${player.queue.length}`, inline: true }
                )
                .setThumbnail(selectedTrack.images?.[0]?.url || null);

            await interaction.editReply({ embeds: [addedEmbed] });
        }

        client.musicSearchResults?.delete(interaction.customId);

        await interaction.message.edit({ components: [] }).catch(() => {});

    } catch (error) {
        console.error('Music select error:', error);
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription(`\`\`\`${error.message}\`\`\``);
        
        await interaction.editReply({ embeds: [embed] });
    }
}