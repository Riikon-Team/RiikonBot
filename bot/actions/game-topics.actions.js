import { iEmbedBuilder } from '../utils/iEmbedBuilder.js';
import { GiftcodeHoyoverseGame } from '../functions/game-topics.js';
import { GIFT_CODES } from '../constants/game-topics.js';
import { E } from '../constants/bot.js';

const createHyperlink = (text, url) => { 
    if (!url) return text;
    return `[${text}](${url})`;
}

export const getGiftcodeAction = async (ctx, {gameName = 'hkrpg'}) => {
    try {
        const result = await GiftcodeHoyoverseGame.execute(ctx.client, gameName);
        const game = GIFT_CODES[gameName.toLowerCase()];

        if (result.error) {
            const embed = new iEmbedBuilder(ctx)
                .setTitle(`${E.error} Lỗi!`)
                .setDescription(
                    result.message || 'Không thể lấy mã code vào lúc này. Vui lòng thử lại sau.'
                )
                .setColor('#ff0000')
                .setTimestamp();

            if (result.validGames) {
                embed.addFields(
                    { name: '🎮 Games có sẵn:', value: 'Chọn một trong các game sau:', inline: false },
                    { name: 'Honkai: Star Rail', value: '`hkrpg`', inline: true },
                    { name: 'Genshin Impact', value: '`genshin`', inline: true },
                    { name: 'Honkai Impact 3rd', value: '`honkai3rd`', inline: true },
                    { name: 'Zenless Zone Zero', value: '`nap`', inline: true },
                    { name: 'Tears of Themis', value: '`tot`', inline: true }
                );
            }

            return ctx.reply({ embeds: [embed] });
        }

        // Handle empty codes
        if (result.codes.length === 0) {
            const embed = new iEmbedBuilder(ctx)
                .setTitle('📭 Không có mã code')
                .setDescription(`Hiện tại không có mã code nào đang hoạt động cho **${result.game.name}**. Vui lòng thử lại sau!`)
                .setColor('#ffaa00')
                .setTimestamp();
            return ctx.reply({ embeds: [embed] });
        }

        // Create success embed
        const embed = new iEmbedBuilder(ctx)
            .setTitle(`🎁 Gift Codes cho ${result.game.name}`)
            .setDescription(
                `Tìm thấy **${result.totalCodes}** mã code đang hoạt động! Click vào mã code để tự động mở trang redeem.\n\n💡 *Hãy nhanh tay sử dụng trước khi hết hạn!*`
            )
            .setColor('#00ff00')
            .setTimestamp();

        // Add codes as fields (max 25 fields per embed)
        const maxCodes = Math.min(result.codes.length, 25);
        for (let i = 0; i < maxCodes; i++) {
            const codeData = result.codes[i];
            embed.addFields({
                name: `🎉 Mã Code #${i + 1}`,
                value: `**${createHyperlink(codeData.code, game.redeemUrl + codeData.code)}** \n🎁 **Phần thưởng:** ${codeData.rewards}`,
                inline: false,
            });
        }

        // Add warning if there are more codes than can be displayed
        if (result.codes.length > 25) {
            embed.addFields({
                name: '⚠️ Lưu ý',
                value: `Chỉ hiển thị 25/${result.codes.length} mã code. Sử dụng website để xem tất cả.`,
                inline: false
            });
        }

        // Add redeem instructions if available
        if (result.game.redeemUrl) {
            embed.addFields({
                name: '📝 Cách sử dụng',
                value: `1. Click vào mã code để mở trang redeem\n2. Đăng nhập tài khoản game\n3. Nhập mã code và nhận quà\n\n🔗 [Trang redeem chính thức](${result.game.redeemUrl})`,
                inline: false
            });
        }

        embed.setFooter({ 
            text: `${commandName ? `/${commandName}` : 'Gift Code Command'}`,
        });

        return ctx.reply({ embeds: [embed] });

    } catch (error) {
        console.error('Error in getGiftcodeAction:', error);

        const errorEmbed = new iEmbedBuilder(ctx)
            .setTitle('Lỗi hệ thống!')
            .setDescription('Đã xảy ra lỗi khi lấy mã gift code. Vui lòng thử lại sau ít phút.')
            .addFields({
                name: '🔧 Thông tin lỗi',
                value: `\`\`\`${error.message}\`\`\``,
                inline: false
            })
            .setColor('#ff0000')
            .setTimestamp();

        return ctx.reply({ embeds: [errorEmbed] });
    }
}

