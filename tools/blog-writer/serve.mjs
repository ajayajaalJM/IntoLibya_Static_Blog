import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const writerRoot = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(writerRoot, '../..');
const viteBin = path.join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js');

const child = spawn(
  process.execPath,
  [viteBin, '--config', path.join(writerRoot, 'vite.config.ts')],
  {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  },
);

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
