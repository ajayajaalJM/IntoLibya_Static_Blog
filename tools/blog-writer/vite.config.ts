import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  root: path.resolve(__dirname),
  server: { port: 5174, strictPort: true },
  resolve: {
    alias: {
      '@lib': path.resolve(__dirname, '../../src/lib'),
    },
  },
});
