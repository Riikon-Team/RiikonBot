import express from 'express';
import logger from '../../utils/logger.js';
import prisma from '../../utils/prisma.js';
import { isAuthenticated } from './middleware.js';
import { getAllPrefixCommands } from '../../utils/commandUtilities.js';

const router = express.Router();

// API lấy danh sách lệnh
router.get('/commands', isAuthenticated, async (req, res) => {
  try {
    const client = req.discordClient;
    const packageManager = req.packageManager;

    if (!client) {
      logger.warn('Discord client not available when fetching commands');
      return res.status(500).json({ error: 'Discord client not initialized' });
    }

    // Initialize empty arrays
    let slashCommands = [];
    let prefixCommands = [];
    
    // Safely retrieve slash commands if they exist
    if (client.commands && typeof client.commands.values === 'function') {
      slashCommands = Array.from(client.commands.values())
        .filter(cmd => cmd && cmd.config)
        .map(cmd => ({
          name: cmd.config.name,
          description: cmd.config.description || 'No description',
          type: 'SLASH',
          category: cmd.config.category || 'Uncategorized',
          enabled: true, // Default status
          package: cmd.config.package || 'unknown'
        }));
    } else {
      logger.warn('No commands collection found on Discord client');
    }
    
    // Nếu slash commands còn thiếu hoặc rỗng, thử lấy từ packageManager
    if ((!slashCommands || slashCommands.length === 0) && packageManager && packageManager.getAllSlashCommands) {
      try {
        logger.info('Trying to get slash commands from packageManager.getAllSlashCommands()');
        const managerSlashCommands = packageManager.getAllSlashCommands();
        
        if (Array.isArray(managerSlashCommands) && managerSlashCommands.length > 0) {
          slashCommands = managerSlashCommands.map(cmd => ({
            name: cmd.name,
            description: cmd.description || 'No description',
            type: 'SLASH',
            category: cmd.category || 'Uncategorized',
            enabled: true, 
            package: cmd.package || 'unknown'
          }));
          logger.info(`Retrieved ${slashCommands.length} slash commands from packageManager`);
        }
      } catch (slashError) {
        logger.warn('Failed to get slash commands from package manager:', slashError);
      }
    }
    
    // Kiểm tra cụ thể lệnh ytmusic nếu vẫn thiếu
    if (packageManager && packageManager.getSlashCommandsForPackage && packageManager.getSlashCommandsForPackage['youtube-music-bot']) {
      try {
        logger.info('Trying to get ytmusic slash commands specifically');
        const ytmusicCommands = await packageManager.getSlashCommandsForPackage['youtube-music-bot']();
        
        if (Array.isArray(ytmusicCommands) && ytmusicCommands.length > 0) {
          // Kiểm tra xem lệnh đã tồn tại chưa
          const existingCommandNames = new Set(slashCommands.map(cmd => cmd.name));
          
          const newYtmusicCommands = ytmusicCommands
            .filter(cmd => !existingCommandNames.has(cmd.name))
            .map(cmd => ({
              name: cmd.name,
              description: cmd.description || 'No description',
              type: 'SLASH',
              category: 'Music',
              enabled: true,
              package: 'youtube-music-bot'
            }));
            
          if (newYtmusicCommands.length > 0) {
            logger.info(`Adding ${newYtmusicCommands.length} ytmusic slash commands`);
            slashCommands = [...slashCommands, ...newYtmusicCommands];
          }
        }
      } catch (ytmusicError) {
        logger.warn('Failed to get ytmusic slash commands:', ytmusicError);
      }
    }
    
    // Safely retrieve prefix commands if they exist
    // if (client.prefixCommands && typeof client.prefixCommands.values === 'function') {
    //   prefixCommands = Array.from(client.prefixCommands.values())
    //     .filter(cmd => cmd && cmd.config)
    //     .map(cmd => ({
    //       name: cmd.config.name,
    //       description: cmd.config.description || 'No description',
    //       type: 'PREFIX',
    //       category: cmd.config.category || 'Uncategorized',
    //       enabled: true, // Default status
    //       package: cmd.config.package || 'unknown'
    //     }));
    // } else if (packageManager && packageManager.getAllPrefixCommands) {
    //   // Try to get prefix commands from package manager as an alternative
    //   try {
    //     prefixCommands = await getAllPrefixCommands()
    //     prefixCommands.map(cmd => ({
    //         name: cmd.name,
    //         description: cmd.description || 'No description',
    //         type: 'PREFIX',
    //         category: cmd.category || 'Uncategorized',
    //         enabled: true, // Default status
    //         package: cmd.package || 'unknown'
    //       }));
    //   } catch (prefixError) {
    //     logger.warn('Failed to get prefix commands from package manager:', prefixError);
    //   }
    // }

    try {
      prefixCommands = await getAllPrefixCommands()
      prefixCommands = prefixCommands.map(cmd => ({
          name: cmd.name,
          description: cmd.description || 'No description',
          type: 'PREFIX',
          category: cmd.category || 'Uncategorized',
          enabled: true, // Default status
          package: cmd.package || 'unknown',
          prefix: cmd.prefix
        }));
    } catch (prefixError) {
      logger.warn('Failed to get prefix commands from package manager:', prefixError);
    }
    // Add command status from database if available
    try {
      const dbCommands = await prisma.command.findMany();
      const commandMap = new Map();
      
      // Create a map of command status by name and type
      dbCommands.forEach(cmd => {
        commandMap.set(`${cmd.type}-${cmd.name}`, cmd.enabled);
      });
      
      // Update status for slash commands
      slashCommands = slashCommands.map(cmd => {
        const key = `SLASH-${cmd.name}`;
        if (commandMap.has(key)) {
          cmd.enabled = commandMap.get(key);
        }
        return cmd;
      });
      
      // Update status for prefix commands
      prefixCommands = prefixCommands.map(cmd => {
        const key = `PREFIX-${cmd.name}`;
        if (commandMap.has(key)) {
          cmd.enabled = commandMap.get(key);
        }
        return cmd;
      });
    } catch (statusError) {
      logger.warn('Failed to get command status from database:', statusError);
    }
    
    // Combine and return commands
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
