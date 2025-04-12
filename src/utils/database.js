import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import logger from './logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.join(__dirname, '../../../../db');
const dbPath = process.env.DB_PATH || path.join(dbDir, 'database.sqlite');

// Đảm bảo thư mục db tồn tại
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db = null;

export async function setupDatabase() {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Tạo các bảng cần thiết
    await db.exec(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        settings TEXT
      );
      
      CREATE TABLE IF NOT EXISTS guilds (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        settings TEXT
      );
    `);
    
    logger.info(`Database initialized at ${dbPath}`);
    return db;
  } catch (error) {
    logger.error('Database initialization error:', error);
    throw error;
  }
}

export async function getDatabase() {
  if (!db) {
    await setupDatabase();
  }
  return db;
}