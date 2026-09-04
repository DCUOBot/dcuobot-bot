import { build } from 'esbuild';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const srcDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src');

const commandFiles = readdirSync(path.join(srcDir, 'commands')).filter((file) =>
  file.endsWith('.command.ts'),
);
const buttonFiles = readdirSync(path.join(srcDir, 'buttons')).filter((file) =>
  file.endsWith('.button.ts'),
);

const entryPoints = [
  path.join(srcDir, 'index.ts'),
  path.join(srcDir, 'handlers', 'load-commands.ts'),
  path.join(srcDir, 'handlers', 'load-buttons.ts'),
  ...commandFiles.map((file) => path.join(srcDir, 'commands', file)),
  ...buttonFiles.map((file) => path.join(srcDir, 'buttons', file)),
];

await build({
  entryPoints,
  outdir: path.join(srcDir, '..', 'dist'),
  outbase: srcDir,
  chunkNames: 'chunks/[name]-[hash]',
  bundle: true,
  splitting: true,
  packages: 'external',
  platform: 'node',
  format: 'esm',
  target: 'esnext',
  sourcemap: true,
  logLevel: 'info',
});
