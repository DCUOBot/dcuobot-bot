import { describe, expect, it } from 'vitest';
import { getSystemInfo } from './system-info-helpers';
import type { Client } from 'discord.js';

const buildClient = (overrides: { ping?: number; uptime?: number | null } = {}): Client =>
  ({
    ws: { ping: overrides.ping ?? 42 },
    uptime: 'uptime' in overrides ? overrides.uptime : 123456,
  }) as unknown as Client;

describe('getSystemInfo', () => {
  it('rounds the Discord gateway ping', () => {
    const client = buildClient({ ping: 42.7 });

    expect(getSystemInfo(client).discordPingMs).toBe(43);
  });

  it('passes through a negative ping (not yet available) unchanged', () => {
    const client = buildClient({ ping: -1 });

    expect(getSystemInfo(client).discordPingMs).toBe(-1);
  });

  it('reads the client uptime in milliseconds', () => {
    const client = buildClient({ uptime: 123456 });

    expect(getSystemInfo(client).uptimeMs).toBe(123456);
  });

  it('defaults uptime to 0 when the client has no uptime yet', () => {
    const client = buildClient({ uptime: null });

    expect(getSystemInfo(client).uptimeMs).toBe(0);
  });
});
