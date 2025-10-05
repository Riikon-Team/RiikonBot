import MusicPlayer from '../../services/MusicPlayer.js';
import { iEmbedBuilder } from '../../utils/iEmbedBuilder.js';
import { E } from '../../constants/bot.js';

export const joinAction = async (ctx) => {
    const { member, client } = ctx;
    const voiceChannel = member?.voice?.channel;

    if (!voiceChannel) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription('Cậu cần vào một kênh voice trước!');

        return ctx.reply({ embeds: [embed] });
    }

    try {
        let player = client.musicPlayers?.get(ctx.guild.id);

        if (player?.connection) {
            const embed = new iEmbedBuilder(ctx)
                .setColor('#ffff00')
                .setTitle(`${E.warning} Thông báo`)
                .setDescription("Tôi đã kết nối với kênh voice rồi!");

            return ctx.reply({ embeds: [embed] });
        }

        if (!player) {
            player = new MusicPlayer(ctx.guild, ctx.channel, voiceChannel);
            if (!client.musicPlayers) {
                client.musicPlayers = new Map();
            }
            client.musicPlayers.set(ctx.guild.id, player);
        }

        player.voiceChannel = voiceChannel;
        player.textChannel = ctx.channel;

        const connected = await player.connect();

        if (connected) {
            const embed = new iEmbedBuilder(ctx)
                .setColor('#00ff00')
                .setTitle(`${E["60226check"]} Đã kết nối`)
                .setDescription(`Bot đã tham gia kênh: **${voiceChannel.name}**`)
                .addFields({
                    name: `${E.CatHeadPat} Bắt đầu phát nhạc`,
                    value: 'Sử dụng lệnh `play` để bắt đầu phát nhạc',
                    inline: false
                });

            await ctx.editReply({ embeds: [embed] });
        } else {
            const embed = new iEmbedBuilder(ctx)
                .setColor('#ff0000')
                .setTitle(`${E.error} Lỗi`)
                .setDescription('Không thể kết nối vào kênh voice!');

            await ctx.editReply({ embeds: [embed] });
        }
    } catch (error) {
        console.error('Join command error:', error);
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription(`\`\`\`${error.message}\`\`\``);

        await ctx.editReply({ embeds: [embed] });
    }
};
