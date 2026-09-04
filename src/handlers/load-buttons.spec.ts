import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logger } from '../lib/logger';
import { loadButtons } from './load-buttons';

vi.mock('../lib/logger', () => ({
  logger: { warn: vi.fn() },
}));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(__dirname, '__fixtures__', 'buttons');

describe('loadButtons', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads every valid .ts and .js button module in the directory', async () => {
    const buttons = await loadButtons(fixturesDir);
    const customIds = buttons.map((button) => button.customId).sort();

    expect(customIds).toEqual(['one', 'two']);
  });

  it('skips a module whose default export has no execute function, and warns', async () => {
    const buttons = await loadButtons(fixturesDir);

    expect(buttons.some((button) => button.customId === 'missing-execute')).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(
      { file: 'missing-execute.button.ts' },
      'Skipped invalid button module: missing customId/execute',
    );
  });

  it('skips a module whose execute export is not a function, and warns', async () => {
    const buttons = await loadButtons(fixturesDir);

    expect(buttons.some((button) => button.customId === 'execute-not-function')).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(
      { file: 'execute-not-function.button.ts' },
      'Skipped invalid button module: missing customId/execute',
    );
  });

  it('skips a module whose default export is not an object, and warns', async () => {
    const buttons = await loadButtons(fixturesDir);

    expect(buttons).toHaveLength(2);
    expect(logger.warn).toHaveBeenCalledWith(
      { file: 'not-an-object.button.ts' },
      'Skipped invalid button module: missing customId/execute',
    );
  });

  it('ignores .d.ts files and files that are not .ts/.js', async () => {
    const buttons = await loadButtons(fixturesDir);

    expect(buttons).toHaveLength(2);
    expect(logger.warn).not.toHaveBeenCalledWith(
      { file: 'declaration.d.ts' },
      expect.anything() as unknown,
    );
    expect(logger.warn).not.toHaveBeenCalledWith(
      { file: 'README.md' },
      expect.anything() as unknown,
    );
  });

  it('returns an empty array for a directory with no button files', async () => {
    const emptyDir = path.join(__dirname, '__fixtures__', 'empty-buttons');
    const buttons = await loadButtons(emptyDir);

    expect(buttons).toEqual([]);
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
