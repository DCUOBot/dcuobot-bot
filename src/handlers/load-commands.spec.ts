import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '../lib/logger';
import { loadCommands } from './load-commands';

vi.mock('../lib/logger', () => ({
  logger: { warn: vi.fn() },
}));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, '__fixtures__', 'commands');

describe('loadCommands', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads every valid .ts and .js command module in the directory', async () => {
    const commands = await loadCommands(fixturesDir);
    const names = commands.map((command) => (command.data as { name: string }).name).sort();

    expect(names).toEqual(['one', 'two']);
  });

  it('skips a module whose default export has no execute function, and warns', async () => {
    const commands = await loadCommands(fixturesDir);

    expect(
      commands.some((command) => (command.data as { name: string }).name === 'missing-execute'),
    ).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(
      { file: 'missing-execute.command.ts' },
      'Skipped invalid command module: missing data/execute',
    );
  });

  it('skips a module whose execute export is not a function, and warns', async () => {
    const commands = await loadCommands(fixturesDir);

    expect(
      commands.some(
        (command) => (command.data as { name: string }).name === 'execute-not-function',
      ),
    ).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(
      { file: 'execute-not-function.command.ts' },
      'Skipped invalid command module: missing data/execute',
    );
  });

  it('skips a module whose default export is not an object, and warns', async () => {
    const commands = await loadCommands(fixturesDir);

    expect(commands).toHaveLength(2);
    expect(logger.warn).toHaveBeenCalledWith(
      { file: 'not-an-object.command.ts' },
      'Skipped invalid command module: missing data/execute',
    );
  });

  it('ignores .d.ts files and files that are not .ts/.js', async () => {
    const commands = await loadCommands(fixturesDir);

    expect(commands).toHaveLength(2);
    expect(logger.warn).not.toHaveBeenCalledWith(
      { file: 'declaration.d.ts' },
      expect.anything() as unknown,
    );
    expect(logger.warn).not.toHaveBeenCalledWith(
      { file: 'README.md' },
      expect.anything() as unknown,
    );
  });

  it('returns an empty array for a directory with no command files', async () => {
    const emptyDir = path.join(__dirname, '__fixtures__', 'empty-commands');
    const commands = await loadCommands(emptyDir);

    expect(commands).toEqual([]);
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
