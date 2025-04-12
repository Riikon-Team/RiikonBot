import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  root: path.join(__dirname, 'src/web/client'),
  base: '/app/',
  build: {
    outDir: path.join(__dirname, 'src/static/app'),
    emptyOutDir: true
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3100'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/web/client')
    }
  }
});