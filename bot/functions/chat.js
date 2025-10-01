import { MAX_CHAT_HISTORY } from '../constants/config.js';
import { getChannelChatHistory } from '../utils/getChat.js';

export const GetChannelChatHistory = {
    data: {
        name: 'GetChannelChatHistory',
        description: 'Get recent chat history from current channel, including user info and timestamps. It useful for AI chat context building. You can understand it as exporting recent messages from a channel.',
        options: [],
        returns: {
            type: 'object',
            description: 'An array of recent messages with user info and timestamps'
        }
    },
    async execute(client, interaction) {
        return await getChannelChatHistory(client, interaction.channel.id);
    }
};

const funcs = {
    GetChannelChatHistory
};

export default funcs;