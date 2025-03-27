import path from 'node:path';
import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';
import pkg from './package.json' with { type: 'json' };

// https://vite.dev/config/
export default defineConfig({
  define: {
    __API_URL__: 'window.__backend_api_url',
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  plugins: [preact()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@helpers': path.resolve(__dirname, './src/helpers'),
      '@lib': path.resolve(__dirname, './src/lib')
    }
  }
});
