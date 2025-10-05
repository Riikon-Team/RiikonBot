import { Events } from 'discord.js';
import { E } from '../constants/bot.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;

        if (['music_pause', 'music_resume', 'music_skip', 'music_stop'].includes(interaction.customId)) {
            return handleMusicPlayerButtons(interaction);
        }
    }
};



async function handleMusicPlayerButtons(interaction) {
    const client = interaction.client;
    const player = client.musicPlayers?.get(interaction.guild.id);

    if (!player) {
        return interaction.reply({
            content: `${E.error} Không có bài hát nào đang phát!`,
            ephemeral: true
        });
    }

    await interaction.deferUpdate();

    try {
        if (interaction.customId === 'music_pause') {
            if (player.pause()) {
                await interaction.followUp({
                    content: '⏸ Đã tạm dừng phát nhạc',
                    ephemeral: true
                });
            } else {
                await interaction.followUp({
                    content: `${E.error} Không thể tạm dừng (có thể đã tạm dừng rồi)`,
                    ephemeral: true
                });
            }
        } else if (interaction.customId === 'music_resume') {
            if (player.resume()) {
                await interaction.followUp({
                    content: '▶ Đã tiếp tục phát nhạc',
                    ephemeral: true
                });
            } else {
                await interaction.followUp({
                    content: `${E.error} Không thể tiếp tục (có thể đang phát rồi)`,
                    ephemeral: true
                });
            }
        } else if (interaction.customId === 'music_skip') {
            const skipped = await player.skip();
            if (skipped) {
                await interaction.followUp({
                    content: '⏭ Đã chuyển bài tiếp theo',
                    ephemeral: true
                });
            } else {
                await interaction.followUp({
                    content: `${E.error} Không có bài tiếp theo để chuyển`,
                    ephemeral: true
                });
            }
        } else if (interaction.customId === 'music_stop') {
            player.stop();
            await interaction.followUp({
                content: '⏹ Đã dừng phát nhạc',
                ephemeral: true
            });
        }
    } catch (error) {
        console.error('Music player button error:', error);
        await interaction.followUp({
            content: `${E.error} Lỗi: ${error.message}`,
            ephemeral: true
        });
    }
}
