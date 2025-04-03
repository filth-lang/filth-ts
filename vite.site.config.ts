import path from 'node:path';
import preact from '@preact/preset-vite';
import { defineConfig } from 'vite';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  build: {
    emptyOutDir: true,
    outDir: 'dist-site',
    sourcemap: true
  },
  define: {
    __API_URL__: 'window.__backend_api_url',
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  plugins: [preact()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@filth': path.resolve(__dirname, './src/lib'),
      '@helpers': path.resolve(__dirname, './src/helpers'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@model': path.resolve(__dirname, './src/model')
    }
  },
  root: '.'
});
