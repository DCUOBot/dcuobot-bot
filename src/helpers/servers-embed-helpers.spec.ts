import { describe, expect, it, vi } from 'vitest';
import { buildServersEmbed } from './servers-embed-helpers';
import type { GameServer } from '../models/game-servers/game-server';

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

const buildGameServer = (overrides: Partial<GameServer> = {}): GameServer => ({
  server_name: 'US',
  status: 'Online',
  population: 'medium',
  ...overrides,
});

const findField = (fields: { name: string; value: string }[], name: string) => {
  const field = fields.find((candidate) => candidate.name === name);

  if (!field) {
    throw new Error(`Field "${name}" not found`);
  }

  return field;
};

describe('buildServersEmbed', () => {
  it('sets title and description', () => {
    const embed = buildServersEmbed([]).toJSON();

    expect(embed.title).toBe(':desktop: DCUO Servers Status');
    expect(embed.description).toBe('All Servers');
  });

  it('applies the shared embed styling (color, author, timestamp)', () => {
    const embed = buildServersEmbed([]).toJSON();

    expect(embed.color).toBe(Number.parseInt('9B59B6', 16));
    expect(embed.author).toEqual({ name: 'DCUOBot', icon_url: 'https://example.com/icon.png' });
    expect(embed.timestamp).toBeTruthy();
  });

  it('renders no fields when there are no game servers', () => {
    const embed = buildServersEmbed([]).toJSON();

    expect(embed.fields ?? []).toHaveLength(0);
  });

  it.each([
    ['us', 'USPC/PS'],
    ['eu', 'EUPC/PS'],
    ['us xbox', 'Xbox'],
  ])('maps server name "%s" to "%s"', (serverName, mappedName) => {
    const server = buildGameServer({ server_name: serverName });
    const fields = buildServersEmbed([server]).toJSON().fields ?? [];

    expect(fields[0]?.name).toBe(`:map: ${mappedName}`);
  });

  it('is case-insensitive when mapping the server name', () => {
    const server = buildGameServer({ server_name: 'US' });
    const fields = buildServersEmbed([server]).toJSON().fields ?? [];

    expect(fields[0]?.name).toBe(':map: USPC/PS');
  });

  it('falls back to the raw server name for an unrecognized server', () => {
    const server = buildGameServer({ server_name: 'Switch' });
    const fields = buildServersEmbed([server]).toJSON().fields ?? [];

    expect(fields[0]?.name).toBe(':map: Switch');
  });

  it.each([
    ['online', ':green_square:', 'Online'],
    ['locked', ':orange_square:', 'Locked'],
    ['offline', ':red_square:', 'Offline'],
  ])('renders emoji and label for status "%s"', (status, emoji, label) => {
    const server = buildGameServer({ status, population: 'medium' });
    const fields = buildServersEmbed([server]).toJSON().fields ?? [];

    expect(fields[0]?.value).toBe(`${emoji} **${label}**\nPopulation: **MEDIUM**`);
  });

  it('falls back to an empty emoji and the raw status for an unrecognized status', () => {
    const server = buildGameServer({ status: 'Maintenance', population: 'low' });
    const fields = buildServersEmbed([server]).toJSON().fields ?? [];

    expect(fields[0]?.value).toBe(' **Maintenance**\nPopulation: **LOW**');
  });

  it('uppercases the population', () => {
    const server = buildGameServer({ population: 'high' });
    const fields = buildServersEmbed([server]).toJSON().fields ?? [];

    expect(fields[0]?.value).toContain('Population: **HIGH**');
  });

  it('renders one field per game server, in order', () => {
    const servers = [
      buildGameServer({ server_name: 'US' }),
      buildGameServer({ server_name: 'EU' }),
    ];
    const fields = buildServersEmbed(servers).toJSON().fields ?? [];

    expect(fields.map((field) => field.name)).toEqual([':map: USPC/PS', ':map: EUPC/PS']);
    expect(findField(fields, ':map: USPC/PS')).toBeTruthy();
    expect(findField(fields, ':map: EUPC/PS')).toBeTruthy();
  });
});
