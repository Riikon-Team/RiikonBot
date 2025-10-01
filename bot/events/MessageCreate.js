import { Events } from 'discord.js';
import { PREFIX } from '../constants/bot.js';
import { handleTimeout, formatTimeLeft } from '../utils/timeout.js';
import { chatWithAI } from '../actions/chat-ai/chat.js';
import { MAX_CHAT_HISTORY } from '../constants/config.js';
import { getChannelChatHistory, getAttactmentsFromLastMessage } from '../utils/getChat.js';

export default {
    name: Events.MessageCreate,
    async execute(message) {
        // Save History for each channel
        const client = message.client;
        if (message.guild) {
            const chatId = `${message.guild.id}-${message.channel.id}`;
            const history = client.chatHistory.get(chatId) || [];
            if (history.length == 0) {
                const fetched = await getChannelChatHistory(client, message.channel.id);
                if (fetched.history) {
                    client.chatHistory.set(chatId, fetched.history.reverse());
                }
            } else {
                history.push({
                    id: message.id,
                    content: message.content,
                    author: {
                        id: message.author.id,
                        username: message.author.username,
                        displayName: message.author.displayName || message.author.username,
                        bot: message.author.bot
                    },
                    timestamp: message.createdTimestamp,
                    embeds: message.embeds,
                    attachments: message.attachments.map(att => ({
                        id: att.id,
                        url: att.url,
                        proxyUrl: att.proxyURL,
                        name: att.name,
                        size: att.size,
                        contentType: att.contentType
                    }))
                });
            }

            // Limit history size
            while (history.length > (MAX_CHAT_HISTORY || 20)) {
                history.shift();
            }
            client.chatLastAttachments.set(chatId, getAttactmentsFromLastMessage(client, chatId));
            client.chatHistory.set(chatId, history);
        }

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
                // Chat with AI
                const aiResponse = await chatWithAI(message.client, prompt, message);
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