import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import logger from './logger.js';

// Đảm bảo đọc file .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Kiểm tra thông tin đăng nhập
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID || process.env.DISCORD_CLIENT_ID;

if (!TOKEN) {
  logger.error('DISCORD_TOKEN không được định nghĩa trong file .env');
  process.exit(1);
}

if (!CLIENT_ID) {
  logger.error('CLIENT_ID hoặc DISCORD_CLIENT_ID không được định nghĩa trong file .env');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, '../commands/slash');

// Kiểm tra xem thư mục lệnh có tồn tại không
if (!fs.existsSync(commandsPath)) {
  logger.error(`Thư mục lệnh không tồn tại: ${commandsPath}`);
  process.exit(1);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

if (commandFiles.length === 0) {
  logger.warn('Không tìm thấy file lệnh nào trong thư mục');
}

async function registerCommands() {
  try {
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      
      try {
        const command = await import(`file://${filePath}`);
        
        if ('config' in command) {
          commands.push({
            name: command.config.name,
            description: command.config.description,
            options: command.config.options || []
          });
          logger.info(`Đã đọc lệnh: ${command.config.name}`);
        } else {
          logger.warn(`Lệnh tại ${filePath} thiếu thuộc tính config`);
        }
      } catch (error) {
        logger.error(`Lỗi khi import file ${filePath}: ${error.message}`);
      }
    }

    if (commands.length === 0) {
      logger.error('Không có lệnh nào để đăng ký');
      return;
    }

    const rest = new REST({ version: '10' }).setToken(TOKEN);

    logger.info('Đang cập nhật lệnh slash...');
    logger.info(`Tìm thấy ${commands.length} lệnh để đăng ký`);
    
    try {
      await rest.put(
        Routes.applicationCommands(CLIENT_ID),
        { body: commands },
      );
      
      logger.info(`Đã đăng ký thành công ${commands.length} lệnh slash!`);
    } catch (error) {
      logger.error(`Lỗi khi đăng ký lệnh: ${error.message}`);
      if (error.code) {
        logger.error(`Mã lỗi: ${error.code}`);
      }
      if (error.response) {
        logger.error(`Response: ${JSON.stringify(error.response)}`);
      }
    }
  } catch (error) {
    logger.error(`Lỗi không mong đợi: ${error.message}`);
  }
}

registerCommands();