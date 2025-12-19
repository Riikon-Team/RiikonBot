import { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, MessageFlags } from 'discord.js';
import { E } from '../constants/bot.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;

        if (['music_pause', 'music_resume', 'music_skip', 'music_stop'].includes(interaction.customId)) {
            return handleMusicPlayerButtons(interaction);
        }

        // Handle attendance buttons
        if (interaction.customId.startsWith('attend_')) {
            return handleAttendanceButton(interaction);
        }
    }
};



async function handleMusicPlayerButtons(interaction) {
    const client = interaction.client;
    const player = client.musicPlayers?.get(interaction.guild.id);

    if (!player) {
        return interaction.reply({
            content: `${E.error} Không có bài hát nào đang phát!`,
            flags: MessageFlags.Ephemeral
        });
    }

    await interaction.deferUpdate();

    try {
        if (interaction.customId === 'music_pause') {
            if (player.pause()) {
                await interaction.followUp({
                    content: '⏸ Đã tạm dừng phát nhạc',
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await interaction.followUp({
                    content: `${E.error} Không thể tạm dừng (có thể đã tạm dừng rồi)`,
                    flags: MessageFlags.Ephemeral
                });
            }
        } else if (interaction.customId === 'music_resume') {
            if (player.resume()) {
                await interaction.followUp({
                    content: '▶ Đã tiếp tục phát nhạc',
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await interaction.followUp({
                    content: `${E.error} Không thể tiếp tục (có thể đang phát rồi)`,
                    flags: MessageFlags.Ephemeral
                });
            }
        } else if (interaction.customId === 'music_skip') {
            const skipped = await player.skip();
            if (skipped) {
                await interaction.followUp({
                    content: '⏭ Đã chuyển bài tiếp theo',
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await interaction.followUp({
                    content: `${E.error} Không có bài tiếp theo để chuyển`,
                    flags: MessageFlags.Ephemeral
                });
            }
        } else if (interaction.customId === 'music_stop') {
            player.stop();
            await interaction.followUp({
                content: '⏹ Đã dừng phát nhạc',
                flags: MessageFlags.Ephemeral
            });
        }
    } catch (error) {
        console.error('Music player button error:', error);
        await interaction.followUp({
            content: `${E.error} Lỗi: ${error.message}`,
            flags: MessageFlags.Ephemeral
        });
    }
}

async function handleAttendanceButton(interaction) {
    try {
        console.log(`[Attendance] Button clicked. Message ID: ${interaction.message.id}`);

        // Get session by message ID directly from client
        const session = interaction.client.attendanceSessions.get(interaction.message.id);

        console.log(`[Attendance] Session found:`, session ? 'Yes' : 'No');
        if (session) {
            console.log(`[Attendance] Session ID: ${session.sessionId}, Title: ${session.title}`);
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

        // If there's a question, show modal
        if (session.question) {
            const modal = new ModalBuilder()
                .setCustomId(`attend_verify_${session.sessionId}`)
                .setTitle('Xác minh điểm danh');

            const questionInput = new TextInputBuilder()
                .setCustomId('answer')
                .setLabel(session.question)
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
                .setMaxLength(512);

            const row = new ActionRowBuilder().addComponents(questionInput);
            modal.addComponents(row);

            return await interaction.showModal(modal);
        }

        // No question, just mark attendance
        const member = interaction.member;

        // Add to attendees
        session.attendees.set(interaction.user.id, {
            userId: interaction.user.id,
            displayName: member.displayName || interaction.user.username,
            tag: interaction.user.tag,
            timestamp: Date.now()
        });

        // Update the original message with new count
        try {
            const newCount = session.attendees.size;
            const embed = interaction.message.embeds[0];
            if (embed && embed.fields && embed.fields[0]) {
                embed.fields[0].value = newCount.toString();
                await interaction.message.edit({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Error updating attendance count:', error);
        }

        return interaction.reply({
            content: `${E.success} Đã điểm danh thành công!`,
            flags: MessageFlags.Ephemeral
        });

    } catch (error) {
        console.error('Attendance button error:', error);
        return interaction.reply({
            content: `${E.error} Lỗi: ${error.message}`,
            flags: MessageFlags.Ephemeral
        });
    }
}
