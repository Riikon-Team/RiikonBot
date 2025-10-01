import { Events } from 'discord.js';
import { handleTimeout, formatTimeLeft } from '../utils/timeout.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction, client) {
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        // Handle command cooldown
        if (command.cooldown) {
            const timeLeft = handleTimeout(client.timeoutCollection, interaction.user.id, command.cooldown);
            if (timeLeft?.onCooldown) {
                return interaction.reply({
                    content: `⏳ Bạn đang trong thời gian chờ! Vui lòng đợi **${formatTimeLeft(timeLeft?.timeLeft)}** trước khi sử dụng lệnh này lại.`,
                    ephemeral: true
                });
            }
        }

        // Execute command
        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error('Error executing slash command:', error);
            const reply = {
                content: '❌ Có lỗi xảy ra khi thực thi lệnh này!',
                ephemeral: true
            };
            
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(reply);
            } else {
                await interaction.reply(reply);
            }
        }
    }
};