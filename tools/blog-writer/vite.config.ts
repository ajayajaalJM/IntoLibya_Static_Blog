import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { blogWriterDevApiPlugin } from './dev-api-plugin';

const writerRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(writerRoot, '../..');

export default defineConfig({
  root: writerRoot,
  server: { port: 5174, strictPort: true },
  resolve: {
    alias: {
      '@lib': path.resolve(writerRoot, '../../src/lib'),
    },
  },
  plugins: [blogWriterDevApiPlugin(repoRoot)],
});
