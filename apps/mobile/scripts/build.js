#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

const args = process.argv.slice(2);

let mode = 'production';
const modeIndex = args.indexOf('--mode');
if (modeIndex !== -1 && args[modeIndex + 1]) {
  mode = args[modeIndex + 1];
  args.splice(modeIndex, 2);
}

const expoArgs = ['export', '--platform', 'web'];
if (mode === 'development') {
  expoArgs.push('--dev');
} else {
  expoArgs.push('--no-minify');
}

const result = spawnSync('npx', ['expo', ...expoArgs, ...args], {
  stdio: 'inherit',
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
