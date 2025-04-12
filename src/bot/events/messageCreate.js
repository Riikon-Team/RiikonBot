import logger from '../../utils/logger.js';

export const config = {
  name: 'messageCreate',
  once: false
};

export async function execute(message, client) {
  // Bỏ qua tin nhắn từ bot
  if (message.author.bot) return;
  
  // Xử lý lệnh prefix
  if (message.content.startsWith(client.config.prefix)) {
    const args = message.content.slice(client.config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    const command = client.prefixCommands.get(commandName);
    if (!command) return;
    
    try {
      await command.execute(message, args, client);
      logger.info(`${message.author.tag} đã sử dụng lệnh ${client.config.prefix}${commandName}`);
    } catch (error) {
      logger.error(`Lỗi khi thực hiện lệnh ${commandName}:`, error);
      await message.reply('Đã xảy ra lỗi khi thực hiện lệnh này!');
    }
  }
}