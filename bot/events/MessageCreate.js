import { Events } from 'discord.js';
import { PREFIX } from '../constants/bot.js';
import { handleTimeout, formatTimeLeft } from '../utils/timeout.js';
import { chatWithAI } from '../actions/chat-ai/chat.js';

export default {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignore messages from bots or without guild context
        if (message.author.bot || !message.guild) return;

        // Tag bot to AI chat
        if (message.mentions.has(message.client.user)) {
            // Convert bot mention to name, orther mentions are not changed
            const prompt = message.content.replace(new RegExp(`<@!?${message.client.user.id}>`, 'g'), message.client.user.username).trim();

            console.log(`AI chat prompt from ${message.author.tag} in #${message.channel.name} of ${message.guild.name}: ${prompt}`);
            
            if (!prompt) return;

            // Indicate that the bot is typing
            message.channel.sendTyping();

            try {
                // Get or create a session ID for guild+channel
                const sessionKey = `${message.guild.id}-${message.channel.id}`;
                let sessionId = message.client.chatSessions.get(sessionKey);
                if (!sessionId) {
                    sessionId = crypto.randomUUID();
                    message.client.chatSessions.set(sessionKey, sessionId);
                }

                // Chat with AI
                const aiResponse = await chatWithAI(message.client, prompt, sessionId, message);
                if (aiResponse) {
                    aiResponse.forEach(async (part, index) => {
                        if (index === 0) {
                            await message.reply({ content: part });
                        } else {
                            await message.channel.send({ content: part });
                        }
                    });
                } else {
                    await message.reply({ content: 'Sorry, I could not generate a response.' });
                }
            } catch (error) {
                console.error('Error during AI chat:', error);
                await message.reply({ content: 'There was an error processing your request.' });
            }
        }

        // Handle prefix commands
        if (message.content.startsWith(PREFIX)) {
            const args = message.content.slice(PREFIX.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();

            const command = message.client.prefixCommands.get(commandName);
            if (!command) return;

            // Handle command cooldown
            if (command.data.cooldown) {
                const timeLeft = handleTimeout(message.client.timeoutCollection, message.author.id, command.data.cooldown);
                if (timeLeft?.onCooldown) {
                    return message.reply({
                        content: `⏳ Bạn đang trong thời gian chờ! Vui lòng đợi **${formatTimeLeft(timeLeft?.timeLeft)}** trước khi sử dụng lệnh này lại.`,
                        ephemeral: true
                    });
                }
            }

            // Execute command
            try {
                await command.execute(message, args);
            } catch (error) {
                console.error(`Error executing prefix command ${commandName}:`, error);
                await message.reply('There was an error executing that command.');
            }
        }
    }
};