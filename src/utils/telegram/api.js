import https from 'https';
import logger from '../logger.js';

export class TelegramApi {
  constructor(token) {
    this.token = token;
    this.apiBase = `https://api.telegram.org/bot${token}`;
  }
  
  // Send an HTTP request to the Telegram API
  async request(method, params = {}) {
    return new Promise((resolve, reject) => {
      const queryParams = new URLSearchParams(params).toString();
      const url = `${this.apiBase}/${method}?${queryParams}`;
      
      logger.debug(`Telegram API request: ${method}`);
      
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(data);
            if (parsedData.ok) {
              resolve(parsedData.result);
            } else {
              logger.error(`Telegram API error: ${parsedData.description}`);
              reject(new Error(parsedData.description || 'Unknown Telegram API error'));
            }
          } catch (e) {
            logger.error(`Failed to parse Telegram API response: ${e.message}`);
            reject(new Error('Failed to parse Telegram API response'));
          }
        });
      }).on('error', (err) => {
        logger.error(`HTTPS request error: ${err.message}`);
        reject(err);
      });
    });
  }
  
  // Get information about the bot
  async getMe() {
    return this.request('getMe');
  }
  
  // Send a message to a chat
  async sendMessage(chatId, text) {
    logger.debug(`Sending Telegram message to ${chatId}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
    return this.request('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML' });
  }
  
  // Get updates from Telegram
  async getUpdates(offset = 0, limit = 100) {
    return this.request('getUpdates', { offset, limit, timeout: 30 });
  }
}