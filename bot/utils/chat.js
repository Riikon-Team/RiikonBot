import { MAX_CHAT_HISTORY } from '../constants/config.js';
import fs from 'node:fs/promises';
import path from 'node:path';

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
        for (let i = history.length - 1; i >= 0; i--) {
            const msg = history[i];
            if (msg.attachments && msg.attachments.length > 0) {
                return msg.attachments;
            }
        }
    }
    return [];
}

export const getUserData = async (fileName) => {
    try {
        const csvPath = path.join(process.cwd(), 'bot', 'data', fileName);
        const csvContent = await fs.readFile(csvPath, 'utf8');
        
        const lines = csvContent.trim().split('\n');
        if (lines.length < 2) {
            return { error: 'CSV file is empty or invalid' };
        }
        
        lines.shift();
        
        const users = [];
        
        for (const line of lines) {
            if (!line.trim()) continue;
            
            const fields = parseCSVLine(line);
            if (fields.length >= 3) {
                const [username, bio, keyword_search] = fields;
                users.push({
                    username: username.replace(/"/g, ''), 
                    data: {
                        bio: bio.replace(/^"|"$/g, ''), 
                        // keyword_search: keyword_search.replace(/^"|"$/g, '') 
                    }
                });
            }
        }
        return users;
    } catch (error) {
        console.error('Error reading CSV file:', error);
        return { error: 'Failed to read user data from CSV file' };
    }
}

function parseCSVLine(line) {
    const fields = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    
    while (i < line.length) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 2;
                continue;
            }
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            fields.push(current);
            current = '';
        } else {
            current += char;
        }
        
        i++;
    }
    
    fields.push(current);
    
    return fields;
} 


