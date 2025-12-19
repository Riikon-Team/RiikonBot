import { iEmbedBuilder } from '../../utils/iEmbedBuilder.js';
import { E } from '../../constants/bot.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const MAX_DURATION = 12 * 60 * 60; // 12 hours in seconds

export const startAttendAction = async (ctx, { duration, title, question = null, answer = null }) => {
    const { member, client, guild, channel } = ctx;

    try {
        // Validate duration
        if (!duration || duration < 1 || duration > MAX_DURATION) {
            const embed = new iEmbedBuilder(ctx)
                .setColor('#ff0000')
                .setTitle(`${E.error} Lỗi`)
                .setDescription(`Thời gian điểm danh phải từ 1 giây đến ${MAX_DURATION} giây (12 giờ)!`);

            return ctx.reply({ embeds: [embed] });
        }

        // Validate title
        if (!title || title.trim().length === 0) {
            const embed = new iEmbedBuilder(ctx)
                .setColor('#ff0000')
                .setTitle(`${E.error} Lỗi`)
                .setDescription('Vui lòng nhập tiêu đề điểm danh!');

            return ctx.reply({ embeds: [embed] });
        }

        // Validate question and answer
        if (question && !answer) {
            const embed = new iEmbedBuilder(ctx)
                .setColor('#ff0000')
                .setTitle(`${E.error} Lỗi`)
                .setDescription('Nếu có câu hỏi, bạn phải cung cấp câu trả lời!');

            return ctx.reply({ embeds: [embed] });
        }

        // Check if user already has an active session in this guild
        const existingSessions = Array.from(client.attendanceSessions.values());
        const userSession = existingSessions.find(s => s.creatorId === member.id && s.guildId === guild.id);

        if (userSession) {
            const embed = new iEmbedBuilder(ctx)
                .setColor('#ff0000')
                .setTitle(`${E.error} Lỗi`)
                .setDescription('Bạn đã có một phiên điểm danh đang hoạt động!\nVui lòng kết thúc phiên hiện tại trước khi tạo phiên mới.');

            return ctx.reply({ embeds: [embed] });
        }

        // Create session object
        const sessionId = `${guild.id}-${member.id}-${Date.now()}`;
        const endTime = Date.now() + (duration * 1000);
        const endTimestamp = Math.floor(endTime / 1000);

        // Create embed
        const embed = new iEmbedBuilder(ctx)
            .setColor('#00ff00')
            .setTitle(`${E['60226check']} Điểm danh: ${title.trim()}`)
            .setDescription(
                `**Người tạo:** ${member.user.tag}\n` +
                `**Thời gian kết thúc:** <t:${endTimestamp}:R>\n` +
                `**Kết thúc lúc:** <t:${endTimestamp}:F>\n\n` +
                (question ? `📝 **Câu hỏi xác minh:** ||${question.trim()}||\n\n` : '') +
                `Nhấn nút bên dưới để điểm danh!`
            )
            .addFields(
                { name: '👥 Số người đã điểm danh', value: '0', inline: true },
                { name: '⏱️ Thời gian còn lại', value: `${duration} giây`, inline: true }
            )
            .setFooter({ text: 'Mỗi người chỉ được điểm danh 1 lần' })
            .setTimestamp();

        // Create button
        const button = new ButtonBuilder()
            .setCustomId(`attend_${sessionId}`)
            .setLabel('Điểm danh')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('✅');

        const row = new ActionRowBuilder().addComponents(button);

        // Send message
        await ctx.reply({ embeds: [embed], components: [row] });

        // Get the actual message ID
        // For interactions, we need to fetch the reply to get the real message ID
        let messageId;
        try {
            if (ctx.isInteraction) {
                // For slash commands, fetch the interaction reply
                const reply = await ctx.source.fetchReply();
                messageId = reply.id;
            } else {
                // For prefix commands, ctx.reply already returned the message
                // This shouldn't happen in the current flow, but just in case
                messageId = null; // Will be handled by the error check below
            }
        } catch (error) {
            console.error('[Attendance] Error fetching message ID:', error);
        }

        if (!messageId) {
            console.error('[Attendance] Failed to get message ID');

            const errorEmbed = new iEmbedBuilder(ctx)
                .setColor('#ff0000')
                .setTitle(`${E.error} Lỗi`)
                .setDescription('Không thể tạo phiên điểm danh. Vui lòng thử lại.');

            return ctx.channel.send({ embeds: [errorEmbed] });
        }

        // Create and store session using MESSAGE ID as key
        const session = {
            sessionId,
            messageId,
            creatorId: member.id,
            guildId: guild.id,
            channelId: channel.id,
            title: title.trim(),
            startTime: Date.now(),
            endTime,
            duration,
            question: question?.trim() || null,
            answer: answer?.trim() || null,
            attendees: new Map()
        };

        client.attendanceSessions.set(messageId, session);
        console.log(`[Attendance] Created session ${sessionId} with message ID: ${messageId}`);

        // Set timeout to auto-end session
        const timeout = setTimeout(async () => {
            try {
                // Import endAttendAction to avoid circular dependency
                const { endAttendAction } = await import('./endAttend.js');
                await endAttendAction(ctx, { autoEnd: true });
            } catch (error) {
                console.error('Error auto-ending attendance session:', error);
            }
        }, duration * 1000);

        session.timeout = timeout;

    } catch (error) {
        console.error('Start attendance error:', error);

        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription(`\`\`\`${error.message}\`\`\``);

        return ctx.reply({ embeds: [embed] });
    }
};
