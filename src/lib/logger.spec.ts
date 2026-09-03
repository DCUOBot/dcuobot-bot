import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockPino, mockLoggerInstance } = vi.hoisted(() => {
  const mockLoggerInstance = { instance: 'pino-logger' };
  const mockPino = vi.fn((_options: Record<string, unknown>) => mockLoggerInstance);

  return { mockPino, mockLoggerInstance };
});

vi.mock('pino', () => ({
  default: mockPino,
}));

describe('logger', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalLogLevel = process.env.LOG_LEVEL;

  beforeEach(() => {
    vi.resetModules();
    mockPino.mockClear();
  });

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalLogLevel === undefined) {
      delete process.env.LOG_LEVEL;
    } else {
      process.env.LOG_LEVEL = originalLogLevel;
    }
  });

  it('exports the instance returned by pino', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.LOG_LEVEL;

    const { logger } = await import('./logger');

    expect(logger).toBe(mockLoggerInstance);
  });

  it('defaults to "debug" level with a pino-pretty transport outside production', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.LOG_LEVEL;

    await import('./logger');

    expect(mockPino).toHaveBeenCalledWith({
      level: 'debug',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    });
  });

  it('defaults to "info" level with no transport in production', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.LOG_LEVEL;

    await import('./logger');

    expect(mockPino).toHaveBeenCalledWith({ level: 'info' });
  });

  it('lets LOG_LEVEL override the default level outside production, keeping the transport', async () => {
    process.env.NODE_ENV = 'development';
    process.env.LOG_LEVEL = 'trace';

    await import('./logger');

    const [options] = mockPino.mock.calls.at(-1) ?? [];

    expect(options).toMatchObject({ level: 'trace', transport: { target: 'pino-pretty' } });
  });

  it('lets LOG_LEVEL override the default level in production, with no transport', async () => {
    process.env.NODE_ENV = 'production';
    process.env.LOG_LEVEL = 'warn';

    await import('./logger');

    expect(mockPino).toHaveBeenCalledWith({ level: 'warn' });
  });

  it('treats any non-"production" NODE_ENV (including unset) as dev', async () => {
    delete process.env.NODE_ENV;
    delete process.env.LOG_LEVEL;

    await import('./logger');

    const [options] = mockPino.mock.calls.at(-1) ?? [];

    expect(options).toMatchObject({ level: 'debug', transport: { target: 'pino-pretty' } });
  });
});
