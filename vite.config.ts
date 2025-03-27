import path from 'node:path';
import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@helpers': path.resolve(__dirname, './src/helpers'),
      '@lib': path.resolve(__dirname, './src/lib')
    }
  }
});
