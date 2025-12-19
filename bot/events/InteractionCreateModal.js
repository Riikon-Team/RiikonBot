import { Events, MessageFlags } from 'discord.js';
import { E } from '../constants/bot.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isModalSubmit()) return;

        // Handle attendance verification modals
        if (interaction.customId.startsWith('attend_verify_')) {
            return handleAttendanceVerification(interaction);
        }
    }
};

async function handleAttendanceVerification(interaction) {
    try {
        const sessionId = interaction.customId.replace('attend_verify_', '');

        // Find session by sessionId
        let session = null;
        for (const [messageId, sess] of interaction.client.attendanceSessions.entries()) {
            if (sess.sessionId === sessionId) {
                session = sess;
                break;
            }
        }

        if (!session) {
            return interaction.reply({
                content: `${E.error} Phiên điểm danh không tồn tại hoặc đã kết thúc!`,
                flags: MessageFlags.Ephemeral
            });
        }

        // Check if user already attended
        if (session.attendees.has(interaction.user.id)) {
            return interaction.reply({
                content: `${E.warning} Bạn đã điểm danh rồi!`,
                flags: MessageFlags.Ephemeral
            });
        }

        // Get the answer
        const userAnswer = interaction.fields.getTextInputValue('answer').trim();

        // Verify answer (case-insensitive comparison)
        if (userAnswer.toLowerCase() !== session.answer.toLowerCase()) {
            return interaction.reply({
                content: `${E.error} Câu trả lời không đúng! Vui lòng thử lại.`,
                flags: MessageFlags.Ephemeral
            });
        }

        // Mark attendance
        const member = interaction.member;
        session.attendees.set(interaction.user.id, {
            userId: interaction.user.id,
            displayName: member.displayName || interaction.user.username,
            tag: interaction.user.tag,
            timestamp: Date.now()
        });

        // Update the original message with new count
        try {
            const channel = await interaction.client.channels.fetch(session.channelId);
            const message = await channel.messages.fetch(session.messageId);

            const newCount = session.attendees.size;
            const embed = message.embeds[0];
            if (embed && embed.data && embed.data.fields && embed.data.fields[0]) {
                embed.data.fields[0].value = newCount.toString();
                await message.edit({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error updating attendance count:', error);
        }

        return interaction.reply({
            content: `${E.success} Đã điểm danh thành công!`,
            flags: MessageFlags.Ephemeral
        });

    } catch (error) {
        console.error('Attendance verification error:', error);
        return interaction.reply({
            content: `${E.error} Lỗi: ${error.message}`,
            flags: MessageFlags.Ephemeral
        });
    }
}
