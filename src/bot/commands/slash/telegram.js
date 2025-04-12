import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { sendMessage } from '../../../utils/telegram/index.js';

export const config = {
  name: 'telegram',
  description: 'Gửi thông báo sang Telegram hoặc kiểm tra trạng thái kết nối',
  options: [
    {
      name: 'test',
      description: 'Kiểm tra kết nối Telegram',
      type: 1
    },
    {
      name: 'send',
      description: 'Gửi thông báo tới Telegram',
      type: 1,
      options: [
        {
          name: 'message',
          description: 'Tin nhắn cần gửi',
          type: 3,
          required: true
        }
      ]
    }
  ],
  defaultMemberPermissions: PermissionFlagsBits.Administrator
};

export async function execute(interaction, client) {
  // Chỉ cho phép admin sử dụng
  if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: '❌ Bạn không có quyền sử dụng lệnh này.',
      ephemeral: true
    });
  }
  
  const subcommand = interaction.options.getSubcommand();
  
  if (subcommand === 'test') {
    await interaction.deferReply();
    try {
      await sendMessage(`🧪 Telegram connection test from Discord by ${interaction.user.tag}`);
      await interaction.editReply('✅ Đã gửi tin nhắn thử nghiệm tới Telegram thành công.');
    } catch (error) {
      await interaction.editReply(`❌ Lỗi khi gửi tin nhắn tới Telegram: ${error.message}`);
    }
  } else if (subcommand === 'send') {
    const message = interaction.options.getString('message');
    await interaction.deferReply();
    
    try {
      await sendMessage(`💬 Message from Discord by ${interaction.user.tag}:\n${message}`);
      await interaction.editReply('✅ Đã gửi tin nhắn tới Telegram thành công.');
    } catch (error) {
      await interaction.editReply(`❌ Lỗi khi gửi tin nhắn tới Telegram: ${error.message}`);
    }
  }
}