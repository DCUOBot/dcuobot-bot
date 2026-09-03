import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { logger } from '../lib/logger';
import type { Command } from '../types/command';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultCommandsDir = path.join(__dirname, '..', 'commands');

function isCommand(value: unknown): value is Command {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'execute' in value &&
    typeof (value as Command).execute === 'function'
  );
}

export async function loadCommands(commandsDir: string = defaultCommandsDir): Promise<Command[]> {
  const files = (await readdir(commandsDir)).filter(
    (file) => (file.endsWith('.ts') || file.endsWith('.js')) && !file.endsWith('.d.ts'),
  );

  const commands: Command[] = [];

  for (const file of files) {
    const moduleUrl = pathToFileURL(path.join(commandsDir, file)).href;
    const imported: unknown = await import(moduleUrl);
    const command = (imported as { default?: unknown }).default;

    if (!isCommand(command)) {
      logger.warn({ file }, 'Skipped invalid command module: missing data/execute');
      continue;
    }

    commands.push(command);
  }

  return commands;
}
