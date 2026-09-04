import { describe, expect, it, vi } from 'vitest';
import { buildInfoEmbed } from './info-embed-helpers';
import type { SystemInfo } from './system-info-helpers';

vi.mock('../lib/config', () => ({
  config: {
    frontendUrl: 'https://dcuo.bot',
    discord: {
      embed: {
        color: '#9B59B6',
        author: 'DCUOBot',
        image: 'https://example.com/icon.png',
      },
    },
  },
}));

const buildSystemInfo = (overrides: Partial<SystemInfo> = {}): SystemInfo => ({
  discordPingMs: 42,
  uptimeMs: 0,
  ...overrides,
});

const findField = (fields: { name: string; value: string }[], name: string) => {
  const field = fields.find((candidate) => candidate.name === name);

  if (!field) {
    throw new Error(`Field "${name}" not found`);
  }

  return field;
};

describe('buildInfoEmbed', () => {
  it('sets title and description', () => {
    const embed = buildInfoEmbed(buildSystemInfo()).toJSON();

    expect(embed.title).toBe('DCUOBot Information');
    expect(embed.description).toBe('Technical information about DCUOBot.');
  });

  it('applies the shared embed styling (color, author, timestamp)', () => {
    const embed = buildInfoEmbed(buildSystemInfo()).toJSON();

    expect(embed.color).toBe(Number.parseInt('9B59B6', 16));
    expect(embed.author).toEqual({ name: 'DCUOBot', icon_url: 'https://example.com/icon.png' });
    expect(embed.timestamp).toBeTruthy();
  });

  it('renders the Discord API ping in milliseconds', () => {
    const fields = buildInfoEmbed(buildSystemInfo({ discordPingMs: 42 })).toJSON().fields ?? [];

    expect(findField(fields, ':ping_pong: Discord API Ping').value).toBe('42 ms');
  });

  it('shows a placeholder for the ping while the gateway heartbeat has not completed yet', () => {
    const fields = buildInfoEmbed(buildSystemInfo({ discordPingMs: -1 })).toJSON().fields ?? [];

    expect(findField(fields, ':ping_pong: Discord API Ping').value).toBe('Calculating...');
  });

  it.each([
    [0, '0s'],
    [45_000, '45s'],
    [125_000, '2m 5s'],
    [3_665_000, '1h 1m 5s'],
    [90_061_000, '1d 1h 1m 1s'],
  ])('formats an uptime of %i ms as "%s"', (uptimeMs, expected) => {
    const fields = buildInfoEmbed(buildSystemInfo({ uptimeMs })).toJSON().fields ?? [];

    expect(findField(fields, ':stopwatch: Bot Uptime').value).toBe(expected);
  });
});
