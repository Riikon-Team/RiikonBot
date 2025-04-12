import logger from '../../utils/logger.js';

export const config = {
  name: 'ready',
  once: true
};

export async function execute(client) {
  logger.info(`Đã đăng nhập với tên ${client.user.tag}`);
  
  // Cập nhật trạng thái
  client.user.setActivity('/help', { type: 'WATCHING' });
}