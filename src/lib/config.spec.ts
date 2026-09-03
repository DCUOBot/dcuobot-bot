import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./logger', () => ({
  logger: { fatal: vi.fn() },
}));

describe('config', () => {
  const originalDiscordToken = process.env.DISCORD_TOKEN;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.resetModules();
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    exitSpy.mockRestore();

    if (originalDiscordToken === undefined) {
      delete process.env.DISCORD_TOKEN;
    } else {
      process.env.DISCORD_TOKEN = originalDiscordToken;
    }
  });

  it('reads the bot token from the DISCORD_TOKEN environment variable', async () => {
    process.env.DISCORD_TOKEN = 'test-token-123';

    const { config } = await import('./config');

    expect(config.discord.botToken).toBe('test-token-123');
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it('logs a fatal error and exits the process when DISCORD_TOKEN is missing', async () => {
    delete process.env.DISCORD_TOKEN;

    const { logger } = await import('./logger');
    await import('./config');

    expect(logger.fatal).toHaveBeenCalledWith('Missing DISCORD_TOKEN environment variable.');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('logs a fatal error and exits the process when DISCORD_TOKEN is an empty string', async () => {
    process.env.DISCORD_TOKEN = '';

    const { logger } = await import('./logger');
    await import('./config');

    expect(logger.fatal).toHaveBeenCalledWith('Missing DISCORD_TOKEN environment variable.');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exposes the expected shape without asserting specific configured values', async () => {
    process.env.DISCORD_TOKEN = 'test-token-123';

    const { config } = await import('./config');

    expect(typeof config.discord.botToken).toBe('string');
    expect(Array.isArray(config.discord.intents)).toBe(true);
    expect(config.discord.intents.length).toBeGreaterThan(0);

    expect(typeof config.discord.embed.color).not.toBe('undefined');
    expect(typeof config.discord.embed.author).toBe('string');
    expect(typeof config.discord.embed.image).toBe('string');

    expect(typeof config.api.baseUrl).toBe('string');
    expect(typeof config.frontendUrl).toBe('string');
  });
});
