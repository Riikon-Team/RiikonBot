import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

router.get('/', (req, res) => {
  // Kiểm tra xem file index.html có tồn tại không
  const indexPath = path.join(__dirname, '../../static/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    // Nếu không, chuyển hướng trực tiếp đến /app
    res.redirect('/app');
  }
});

// Serve Vue app cho các route /app/*
router.get('/app/*', (req, res) => {
  const appIndexPath = path.join(__dirname, '../../static/app/index.html');
  if (fs.existsSync(appIndexPath)) {
    res.sendFile(appIndexPath);
  } else {
    res.status(404).send('Dashboard app not found. Run "npm run build" first.');
  }
});

// Trang chính
router.get('/app', (req, res) => {
  const appIndexPath = path.join(__dirname, '../../static/app/index.html');
  if (fs.existsSync(appIndexPath)) {
    res.sendFile(appIndexPath);
  } else {
    res.status(404).send('Dashboard app not found. Run "npm run build" first.');
  }
});

export default router;