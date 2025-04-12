import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger.js';

// Tạo instance PrismaClient
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Log các truy vấn trong development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug(`Query: ${e.query}`);
  });
}

prisma.$on('error', (e) => {
  logger.error(`Prisma error: ${e.message}`);
});

export default prisma;