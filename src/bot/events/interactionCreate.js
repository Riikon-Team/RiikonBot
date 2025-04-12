import logger from '../../utils/logger.js';

export const config = {
  name: 'interactionCreate',
  once: false
};

export async function execute(interaction, client) {
  // Xử lý lệnh slash
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    
    if (!command) return;
    
    try {
      await command.execute(interaction, client);
      logger.info(`${interaction.user.tag} đã sử dụng lệnh /${interaction.commandName}`);
    } catch (error) {
      logger.error(`Lỗi khi thực hiện lệnh ${interaction.commandName}:`, error);
      
      const errorMessage = { 
        content: 'Đã xảy ra lỗi khi thực hiện lệnh này!', 
        ephemeral: true 
      };
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }
}