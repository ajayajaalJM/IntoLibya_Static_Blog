import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const writerRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: writerRoot,
  server: { port: 5174, strictPort: true },
  resolve: {
    alias: {
      '@lib': path.resolve(writerRoot, '../../src/lib'),
    },
  },
});
