import express from 'express';
import logger from '../../utils/logger.js';
import prisma from '../utils/prisma.js'; 

const router = express.Router();

// Middleware kiểm tra xác thực
const isAuthenticated = (req, res, next) => {
  next();
};

// API get thông tin bot
router.get('/bot', isAuthenticated, async (req, res) => {
  try {
    const client = req.app.get('client');
    
    res.json({
      username: client.user.username,
      id: client.user.id,
      guilds: client.guilds.cache.size,
      users: client.users.cache.size
    });
  } catch (error) {
    logger.error('Error fetching bot info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API lấy danh sách servers
router.get('/guilds', isAuthenticated, async (req, res) => {
  try {
    const client = req.app.get('client');
    
    // Lấy danh sách guilds từ Discord API
    const discordGuilds = client.guilds.cache.map(guild => ({
      id: guild.id,
      name: guild.name,
      memberCount: guild.memberCount,
      icon: guild.iconURL()
    }));
    
    // Lấy thông tin từ database
    const dbGuilds = await prisma.guild.findMany({
      select: {
        id: true,
        prefix: true
      }
    });
    
    // Gộp thông tin
    const guildsMap = new Map();
    dbGuilds.forEach(guild => guildsMap.set(guild.id, guild));
    
    const guilds = discordGuilds.map(guild => ({
      ...guild,
      prefix: guildsMap.has(guild.id) ? guildsMap.get(guild.id).prefix : '!'
    }));
    
    // Đồng bộ guilds vào database nếu chưa có
    for (const guild of discordGuilds) {
      if (!guildsMap.has(guild.id)) {
        await prisma.guild.upsert({
          where: { id: guild.id },
          update: { name: guild.name },
          create: {
            id: guild.id,
            name: guild.name,
            prefix: '!'
          }
        });
      }
    }
    
    res.json(guilds);
  } catch (error) {
    logger.error('Error fetching guilds:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API lấy chi tiết server
router.get('/guilds/:id', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const client = req.app.get('client');
    
    // Kiểm tra guild trong Discord
    const discordGuild = client.guilds.cache.get(id);
    if (!discordGuild) {
      return res.status(404).json({ error: 'Guild not found' });
    }
    
    // Lấy thông tin từ database
    let dbGuild = await prisma.guild.findUnique({
      where: { id },
      include: {
        commands: true
      }
    });
    
    // Tạo guild trong database nếu chưa có
    if (!dbGuild) {
      dbGuild = await prisma.guild.create({
        data: {
          id,
          name: discordGuild.name,
          prefix: '!'
        },
        include: {
          commands: true
        }
      });
    }
    
    // Gộp thông tin
    const guild = {
      id: discordGuild.id,
      name: discordGuild.name,
      memberCount: discordGuild.memberCount,
      icon: discordGuild.iconURL(),
      prefix: dbGuild.prefix,
      commands: dbGuild.commands
    };
    
    res.json(guild);
  } catch (error) {
    logger.error(`Error fetching guild ${req.params.id}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API cập nhật prefix của server
router.patch('/guilds/:id/prefix', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { prefix } = req.body;
    
    if (!prefix) {
      return res.status(400).json({ error: 'Prefix is required' });
    }
    
    // Cập nhật trong database
    const guild = await prisma.guild.update({
      where: { id },
      data: { prefix }
    });
    
    res.json(guild);
  } catch (error) {
    logger.error(`Error updating guild ${req.params.id} prefix:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API lấy danh sách lệnh
router.get('/commands', isAuthenticated, async (req, res) => {
  try {
    const client = req.app.get('client');
    
    // Lấy danh sách commands từ Discord
    const slashCommands = Array.from(client.commands.values()).map(cmd => ({
      name: cmd.config.name,
      description: cmd.config.description,
      type: 'SLASH'
    }));
    
    const prefixCommands = Array.from(client.prefixCommands.values()).map(cmd => ({
      name: cmd.config.name,
      description: cmd.config.description,
      type: 'PREFIX'
    }));
    
    const commands = [...slashCommands, ...prefixCommands];
    
    res.json(commands);
  } catch (error) {
    logger.error('Error fetching commands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API bật/tắt lệnh
router.patch('/commands/:guildId/:commandName', isAuthenticated, async (req, res) => {
  try {
    const { guildId, commandName } = req.params;
    const { enabled, type = 'SLASH' } = req.body;
    
    if (enabled === undefined) {
      return res.status(400).json({ error: 'Enabled status is required' });
    }
    
    // Tìm lệnh trong database
    let command = await prisma.command.findFirst({
      where: {
        name: commandName,
        guildId,
        type
      }
    });
    
    // Nếu chưa có, tạo mới
    if (!command) {
      command = await prisma.command.create({
        data: {
          name: commandName,
          type,
          enabled,
          guild: {
            connect: {
              id: guildId
            }
          }
        }
      });
    } else {
      // Nếu đã có, cập nhật
      command = await prisma.command.update({
        where: { id: command.id },
        data: { enabled }
      });
    }
    
    res.json(command);
  } catch (error) {
    logger.error(`Error updating command:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;