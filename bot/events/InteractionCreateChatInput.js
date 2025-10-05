import { Events } from 'discord.js';
import { handleTimeout, formatTimeLeft } from '../utils/timeout.js';
import { ContextAdapter } from '../contexts/ContextAdapter.js';
import { E } from '../constants/bot.js';

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        const { client } = interaction;
        if (!interaction.isChatInputCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        if (command.cooldown) {
            const timeLeft = handleTimeout(client.timeoutCollection, interaction.user.id, command.cooldown);
            if (timeLeft?.onCooldown) {
                return interaction.reply({
                    content: `${E.timeout} Bạn đang trong thời gian chờ! Vui lòng đợi **${formatTimeLeft(timeLeft?.timeLeft)}** trước khi sử dụng lệnh này lại.`,
                    ephemeral: true
                });
            }
        }

        try {
            const ctx = new ContextAdapter(interaction);
            await command.execute(ctx);
        } catch (error) {
            console.error('Error executing slash command:', error);
            const reply = {
                content: `${E.error} Có lỗi xảy ra khi thực thi lệnh này!`,
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