import { MAX_CHAT_HISTORY } from '../constants/config.js';

export const getChannelChatHistory = async (client, channelId) => {
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) {
            return { error: 'Invalid channel ID or channel is not text-based.' };
        }

        const messages = await channel.messages.fetch({ limit: MAX_CHAT_HISTORY || 20 });
        const history = messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            author: {
                id: msg.author.id,
                username: msg.author.username,
                displayName: msg.author.displayName || msg.author.username,
                bot: msg.author.bot
            },
            timestamp: msg.createdTimestamp,
            embeds: msg.embeds,
            attachments: msg.attachments.map(att => ({
                id: att.id,
                url: att.url,
                proxyUrl: att.proxyURL,
                name: att.name,
                size: att.size,
                contentType: att.contentType
            }))
        }));

        return { history };
    } catch (error) {
        console.error('Error fetching channel chat history:', error);
        return { error: 'Failed to retrieve chat history.' };
    }
}

export const getAttactmentsFromLastMessage = (client, chatId) => {
    const history = client.chatHistory.get(chatId) || [];
    if (history.length > 0) {
        // Loop to find the last message with attachments
        for (let i = history.length - 1; i >= 0; i--) {
            const msg = history[i];
            if (msg.attachments && msg.attachments.length > 0) {
                return msg.attachments;
            }
        }
    }
    return [];
}

