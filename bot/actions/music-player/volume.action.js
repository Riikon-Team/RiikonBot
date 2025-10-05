import { iEmbedBuilder } from '../../utils/iEmbedBuilder.js';
import { E } from '../../constants/bot.js';

export const volumeAction = async (ctx, { volume }) => {

    const player = ctx.client.musicPlayers?.get(ctx.guild.id);
    const member = ctx.member;

    if (!member?.voice?.channel) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle( `${E.error} Lỗi`)
            .setDescription('Bạn cần vào kênh voice để sử dụng lệnh này!');

        return ctx.reply({ embeds: [embed] });
    }

    if (!player) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription('Không có music player nào đang hoạt động!');

        return ctx.reply({ embeds: [embed] });
    }

    // Show current volume
    if (args.length === 0) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#0099ff')
            .setTitle(`${E["21362bocchitherock"]} Âm lượng hiện tại`)
            .setDescription(`Âm lượng: **${player.volume}%**`)
            .addFields({
                name: '💡 Hướng dẫn',
                value: 'Sử dụng `volume <số>` để thay đổi âm lượng (1-100)',
                inline: false
            });

        return ctx.reply({ embeds: [embed] });
    }

    if (Number.isNaN(volume) || volume < 1 || volume > 100) {
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle('❌ Lỗi')
            .setDescription('Âm lượng phải là số từ 1 đến 100!');

        return ctx.reply({ embeds: [embed] });
    }

    try {
        const newVolume = player.setVolume(volume);

        let emoji = '🔊';
        if (newVolume < 33) emoji = '🔉';
        else if (newVolume < 66) emoji = '🔊';
        else emoji = '📢';

        const embed = new iEmbedBuilder(ctx)
            .setColor('#00ff00')
            .setTitle(`${emoji} Đã thay đổi âm lượng`)
            .setDescription(`Âm lượng: **${newVolume}%**`);

        await ctx.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Volume command error:', error);
        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription(`\`\`\`${error.message}\`\`\``);

        await ctx.reply({ embeds: [embed] });
    }
}