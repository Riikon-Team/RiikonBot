import { EmbedBuilder } from 'discord.js';

export const config = {
  name: 'help',
  description: 'Hiển thị thông tin trợ giúp về các lệnh',
  usage: 'help [tên lệnh]'
};

export async function execute(message, args, client) {
  const prefix = client.config.prefix;
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('RiikonBot - Trợ giúp')
    .setFooter({ text: 'RiikonBot v1.0.0' });

  // Nếu cung cấp tên lệnh, hiển thị thông tin chi tiết
  if (args.length) {
    const commandName = args[0].toLowerCase();
    const command = client.prefixCommands.get(commandName);
    
    if (!command) {
      return message.reply(`Không tìm thấy lệnh "${commandName}"`);
    }
    
    embed.setDescription(`Chi tiết về lệnh ${prefix}${command.config.name}:`)
      .addFields(
        { name: 'Tên', value: command.config.name },
        { name: 'Mô tả', value: command.config.description || 'Không có mô tả' },
        { name: 'Cách sử dụng', value: `${prefix}${command.config.usage}` || `${prefix}${command.config.name}` }
      );
  } else {
    // Hiển thị tất cả lệnh
    embed.setDescription(`Sử dụng \`${prefix}help [tên lệnh]\` để xem thông tin chi tiết về lệnh cụ thể.`);
    
    client.prefixCommands.forEach(command => {
      embed.addFields({ name: `${prefix}${command.config.name}`, value: command.config.description || 'Không có mô tả' });
    });
  }
  
  await message.reply({ embeds: [embed] });
}