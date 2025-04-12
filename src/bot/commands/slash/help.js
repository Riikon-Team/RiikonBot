import { EmbedBuilder } from 'discord.js';

export const config = {
  name: 'help',
  description: 'Hiển thị thông tin trợ giúp về các lệnh'
};

export async function execute(interaction, client) {
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('RiikonBot - Trợ giúp')
    .setDescription('Danh sách các lệnh có sẵn:')
    .setFooter({ text: 'RiikonBot v1.0.0' });
  
  client.commands.forEach(command => {
    embed.addFields({ name: `/${command.config.name}`, value: command.config.description || 'Không có mô tả' });
  });
  
  await interaction.reply({ embeds: [embed] });
}