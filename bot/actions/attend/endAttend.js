import { iEmbedBuilder } from '../../utils/iEmbedBuilder.js';
import { E } from '../../constants/bot.js';

export const endAttendAction = async (ctx, { autoEnd = false } = {}) => {
    const { member, client, guild, channel } = ctx;

    try {
        // Find session by creator ID
        let session = null;
        let sessionMessageId = null;

        for (const [messageId, sess] of client.attendanceSessions.entries()) {
            if (sess.creatorId === member.id && sess.guildId === guild.id) {
                session = sess;
                sessionMessageId = messageId;
                break;
            }
        }

        if (!session) {
            const embed = new iEmbedBuilder(ctx)
                .setColor('#ff0000')
                .setTitle(`${E.error} Lỗi`)
                .setDescription('Bạn không có phiên điểm danh nào đang hoạt động!');

            return ctx.reply({ embeds: [embed], flags: [64] });
        }

        // Get attendees
        const attendees = Array.from(session.attendees.values());
        const attendeeCount = attendees.length;

        // Clear timeout
        if (session.timeout) {
            clearTimeout(session.timeout);
        }

        // Try to disable the button by editing the original message
        try {
            const originalChannel = await client.channels.fetch(session.channelId);
            if (originalChannel && session.messageId) {
                const originalMessage = await originalChannel.messages.fetch(session.messageId);
                if (originalMessage) {
                    // Disable button
                    const disabledRow = originalMessage.components[0];
                    if (disabledRow) {
                        disabledRow.components[0].data.disabled = true;
                        await originalMessage.edit({ components: [disabledRow] });
                    }
                }
            }
        } catch (error) {
            console.error('Error disabling attendance button:', error);
        }

        // Send public message
        const publicEmbed = new iEmbedBuilder(ctx)
            .setColor('#ff9900')
            .setTitle(`${E.success} Điểm danh kết thúc`)
            .setDescription(
                `**Tiêu đề:** ${session.title}\n` +
                `**Người tạo:** <@${session.creatorId}>\n` +
                `**Số người đã điểm danh:** ${attendeeCount}`
            )
            .setTimestamp();

        await channel.send({ embeds: [publicEmbed] });

        // Send private message to creator with attendee list
        try {
            const creator = await client.users.fetch(session.creatorId);

            if (attendeeCount === 0) {
                const dmEmbed = new iEmbedBuilder(ctx)
                    .setColor('#ff9900')
                    .setTitle(`${E.warning} Danh sách điểm danh`)
                    .setDescription(
                        `**Tiêu đề:** ${session.title}\n` +
                        `**Server:** ${guild.name}\n\n` +
                        `Không có ai điểm danh.`
                    )
                    .setTimestamp();

                await creator.send({ embeds: [dmEmbed] });
            } else {
                // Build attendee list
                let attendeeList = '';
                for (const attendee of attendees) {
                    attendeeList += `• **${attendee.displayName}** (@${attendee.tag}) - <t:${Math.floor(attendee.timestamp / 1000)}:R>\n`;
                }

                // Split into chunks if too long
                const maxLength = 4000;
                if (attendeeList.length > maxLength) {
                    // Send multiple messages
                    const chunks = [];
                    let currentChunk = '';
                    const lines = attendeeList.split('\n');

                    for (const line of lines) {
                        if (currentChunk.length + line.length + 1 > maxLength) {
                            chunks.push(currentChunk);
                            currentChunk = line + '\n';
                        } else {
                            currentChunk += line + '\n';
                        }
                    }
                    if (currentChunk) {
                        chunks.push(currentChunk);
                    }

                    // Send first chunk with header
                    const firstEmbed = new iEmbedBuilder(ctx)
                        .setColor('#00ff00')
                        .setTitle(`${E.success} Danh sách điểm danh`)
                        .setDescription(
                            `**Tiêu đề:** ${session.title}\n` +
                            `**Server:** ${guild.name}\n` +
                            `**Tổng số người:** ${attendeeCount}\n\n` +
                            `**Danh sách (Phần 1/${chunks.length}):**\n${chunks[0]}`
                        )
                        .setTimestamp();

                    await creator.send({ embeds: [firstEmbed] });

                    // Send remaining chunks
                    for (let i = 1; i < chunks.length; i++) {
                        const chunkEmbed = new iEmbedBuilder(ctx)
                            .setColor('#00ff00')
                            .setDescription(`**Danh sách (Phần ${i + 1}/${chunks.length}):**\n${chunks[i]}`);

                        await creator.send({ embeds: [chunkEmbed] });
                    }
                } else {
                    const dmEmbed = new iEmbedBuilder(ctx)
                        .setColor('#00ff00')
                        .setTitle(`${E.success} Danh sách điểm danh`)
                        .setDescription(
                            `**Tiêu đề:** ${session.title}\n` +
                            `**Server:** ${guild.name}\n` +
                            `**Tổng số người:** ${attendeeCount}\n\n` +
                            `**Danh sách:**\n${attendeeList}`
                        )
                        .setTimestamp();

                    await creator.send({ embeds: [dmEmbed] });
                }
            }
        } catch (error) {
            console.error('Error sending DM to creator:', error);

            // Notify in channel that DM failed
            const errorEmbed = new iEmbedBuilder(ctx)
                .setColor('#ff0000')
                .setTitle(`${E.warning} Thông báo`)
                .setDescription(`<@${session.creatorId}>, không thể gửi tin nhắn riêng tư cho bạn!\nVui lòng bật DM từ thành viên server.`);

            await channel.send({ embeds: [errorEmbed] });
        }

        // Delete session from client map
        client.attendanceSessions.delete(sessionMessageId);

        // Send confirmation if not auto-ended
        if (!autoEnd) {
            const confirmEmbed = new iEmbedBuilder(ctx)
                .setColor('#00ff00')
                .setTitle(`${E.success} Thành công`)
                .setDescription('Phiên điểm danh đã được kết thúc.');

            await ctx.reply({ embeds: [confirmEmbed], flags: [64] });
        }

    } catch (error) {
        console.error('End attendance error:', error);

        const embed = new iEmbedBuilder(ctx)
            .setColor('#ff0000')
            .setTitle(`${E.error} Lỗi`)
            .setDescription(`\`\`\`${error.message}\`\`\``);

        return ctx.reply({ embeds: [embed], flags: [64] });
    }
};
