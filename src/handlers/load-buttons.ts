import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { logger } from '../lib/logger';
import type { Button } from '../types/button';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultButtonsDir = path.join(__dirname, '..', 'buttons');

function isButton(value: unknown): value is Button {
  return (
    typeof value === 'object' &&
    value !== null &&
    'customId' in value &&
    'execute' in value &&
    typeof (value as Button).execute === 'function'
  );
}

export async function loadButtons(buttonsDir: string = defaultButtonsDir): Promise<Button[]> {
  const files = (await readdir(buttonsDir)).filter(
    (file) =>
      (file.endsWith('.ts') || file.endsWith('.js')) &&
      !file.endsWith('.d.ts') &&
      !file.endsWith('.spec.ts') &&
      !file.endsWith('.spec.js') &&
      !file.endsWith('.test.ts') &&
      !file.endsWith('.test.js'),
  );

  const buttons: Button[] = [];

  for (const file of files) {
    const moduleUrl = pathToFileURL(path.join(buttonsDir, file)).href;
    const imported: unknown = await import(moduleUrl);
    const button = (imported as { default?: unknown }).default;

    if (!isButton(button)) {
      logger.warn({ file }, 'Skipped invalid button module: missing customId/execute');
      continue;
    }

    buttons.push(button);
  }

  return buttons;
}
