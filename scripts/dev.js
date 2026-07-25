#!/usr/bin/env node

import { spawn } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, '..');

const isWin = process.platform === 'win32';
const cmd = isWin ? 'cmd' : 'sh';
const args = isWin ? ['/c'] : ['-c'];

function launch(name, command, cwd) {
  const child = spawn(cmd, [...args, command], {
    cwd,
    stdio: 'inherit',
    shell: isWin,
  });
  child.on('error', (e) => {
    if (e.code === 'ENOENT') console.error(`\x1b[31m✗ ${name}: command not found\x1b[0m`);
  });
  return child;
}

console.log('\x1b[1m🎬 Starting AniStrem in development mode...\x1b[0m\n');

const backend = launch('Backend', 'npm run dev', resolve(root, 'backend'));
const frontend = launch('Frontend', 'npm run dev', resolve(root, 'frontend'));

function cleanup() {
  backend.kill('SIGTERM');
  frontend.kill('SIGTERM');
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);