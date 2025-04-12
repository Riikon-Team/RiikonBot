import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js'
import apiRoutes from './routes/api.js';
import viewRoutes from './routes/views.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function startWebServer(client) {
  const app = express();
  const PORT = process.env.WEB_PORT || 3100;
  
  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Serve static files
  app.use(express.static(path.join(__dirname, '../static')));
  app.use('/app', express.static(path.join(__dirname, '../static/app')));
  
  // Lưu client trong app để các route có thể truy cập
  app.set('client', client);
  
  // Đăng ký routes
  app.use('/api', apiRoutes);
  app.use('/', viewRoutes);
  
  // Xử lý lỗi 404
  app.use((req, res) => {
    // Nếu request API, trả về JSON
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Route not found' });
    }
    // Nếu không, redirect về dashboard
    res.redirect('/app');
  });
  
  // Xử lý lỗi
  app.use((err, req, res, next) => {
    logger.error('Web server error:', err);
    if (req.path.startsWith('/api')) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.status(500).send('Internal Server Error');
  });
  
  // Khởi động server
  app.listen(PORT, () => {
    logger.info(`WEB: http://localhost:${PORT}`);
  });
  
  return app;
}