import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@filth': path.resolve(__dirname, './src/lib'),
      '@helpers': path.resolve(__dirname, './src/helpers')
    }
  },
  test: {
    coverage: {
      exclude: ['src/lib/parser/parser.ts'],
      include: ['src/lib/**/*.ts'],

      provider: 'v8',
      reporter: ['text', 'json', 'html']
    },
    environment: 'node',
    globals: true,
    setupFiles: ['./src/lib/test.setup.ts']
  }
});
