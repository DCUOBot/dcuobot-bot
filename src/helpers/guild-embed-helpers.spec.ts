import { describe, expect, it, vi } from 'vitest';
import { buildGuildEmbed, buildGuildImageUrl, buildGuildUrl } from './guild-embed-helpers';
import type { Guild } from '../models/guilds/guild';
import type { GuildCharacter } from '../models/guilds/guild-character';

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

const buildGuildCharacter = (overrides: Partial<GuildCharacter> = {}): GuildCharacter => ({
  character_id: '1',
  name: 'Robin',
  world_id: '2',
  rank: 1,
  skill_points: 200,
  combat_rating: 350,
  pvp_combat_rating: 300,
  ...overrides,
});

const buildGuild = (overrides: Partial<Guild> = {}): Guild => ({
  guild_id: '1',
  name: 'Justice League',
  world_id: '2',
  alignment: 'Hero',
  average_skill_points: 250,
  average_combat_rating: 400,
  average_pvp_combat_rating: 380,
  member_count: 0,
  characters: [],
  ...overrides,
});

const findField = (fields: { name: string; value: string; inline?: boolean }[], name: string) => {
  const field = fields.find((candidate) => candidate.name === name);

  if (!field) {
    throw new Error(`Field "${name}" not found`);
  }

  return field;
};

describe('buildGuildImageUrl', () => {
  it('points at the frontend guild placeholder image', () => {
    expect(buildGuildImageUrl()).toBe('https://dcuo.bot/assets/images/genders/mixed.jpeg');
  });
});

describe('buildGuildUrl', () => {
  it('points at the frontend leagues page with a query and worldId param', () => {
    const guild = buildGuild({ name: 'Justice League', world_id: '2' });

    expect(buildGuildUrl(guild)).toBe('https://dcuo.bot/leagues?query=Justice+League&worldId=2');
  });

  it('URL-encodes special characters in the guild name', () => {
    const guild = buildGuild({ name: 'Bat & Robin?' });

    const url = new URL(buildGuildUrl(guild));

    expect(url.searchParams.get('query')).toBe('Bat & Robin?');
  });
});

describe('buildGuildEmbed', () => {
  it('sets title, url, description and thumbnail from the guild', () => {
    const guild = buildGuild({ name: 'Justice League', world_id: '2', alignment: 'Hero' });
    const embed = buildGuildEmbed(guild).toJSON();

    expect(embed.title).toBe(':busts_in_silhouette: Justice League');
    expect(embed.url).toBe(buildGuildUrl(guild));
    expect(embed.description).toBe('Server: USPC/PS • Members: 0 • Alignment: Hero');
    expect(embed.thumbnail?.url).toBe(buildGuildImageUrl());
  });

  it('applies the shared embed styling (color, author, timestamp)', () => {
    const embed = buildGuildEmbed(buildGuild()).toJSON();

    expect(embed.color).toBe(Number.parseInt('9B59B6', 16));
    expect(embed.author).toEqual({ name: 'DCUOBot', icon_url: 'https://example.com/icon.png' });
    expect(embed.timestamp).toBeTruthy();
  });

  it('propagates an error for an unrecognized world ID', () => {
    const guild = buildGuild({ world_id: '9999' });

    expect(() => buildGuildEmbed(guild)).toThrow('Invalid world ID.');
  });

  it('renders average stat fields', () => {
    const guild = buildGuild({
      average_skill_points: 250,
      average_combat_rating: 400,
      average_pvp_combat_rating: 380,
    });
    const fields = buildGuildEmbed(guild).toJSON().fields ?? [];

    expect(findField(fields, ':chart_with_upwards_trend: Avg. Skill Points').value).toBe('250');
    expect(findField(fields, ':dagger: Avg. Combat Rating').value).toBe('400');
    expect(findField(fields, ':crossed_swords: Avg. PvP Combat Rating').value).toBe('380');
  });

  it('renders a field per member with rank, SP, CR and PvP CR', () => {
    const member = buildGuildCharacter({
      name: 'Robin',
      rank: 3,
      skill_points: 200,
      combat_rating: 350,
      pvp_combat_rating: 300,
    });
    const guild = buildGuild({ characters: [member] });
    const fields = buildGuildEmbed(guild).toJSON().fields ?? [];

    expect(findField(fields, ':bust_in_silhouette: Robin').value).toBe(
      'Rank: **4** • SP: **200** • CR: **350** • PvP CR: **300**',
    );
  });

  it('labels rank 0 as "1 (Leader)"', () => {
    const guild = buildGuild({
      characters: [buildGuildCharacter({ name: 'Superman', rank: 0 })],
    });
    const fields = buildGuildEmbed(guild).toJSON().fields ?? [];

    expect(findField(fields, ':bust_in_silhouette: Superman').value).toContain(
      'Rank: **1 (Leader)**',
    );
  });

  it('renders at most 10 member fields', () => {
    const characters = Array.from({ length: 12 }, (_, i) =>
      buildGuildCharacter({ character_id: `${i}`, name: `Member ${i}` }),
    );
    const guild = buildGuild({ characters });
    const fields = buildGuildEmbed(guild).toJSON().fields ?? [];

    const memberFields = fields.filter((field) => field.name.startsWith(':bust_in_silhouette:'));
    expect(memberFields).toHaveLength(10);
    expect(memberFields.map((field) => field.name)).not.toContain(':bust_in_silhouette: Member 10');
  });

  it('adds an overflow field listing how many members were not shown', () => {
    const characters = Array.from({ length: 13 }, (_, i) =>
      buildGuildCharacter({ character_id: `${i}`, name: `Member ${i}` }),
    );
    const guild = buildGuild({ characters });
    const fields = buildGuildEmbed(guild).toJSON().fields ?? [];

    const overflowField = fields[fields.length - 1];
    expect(overflowField?.value).toBe('... and **3** more');
  });

  it('omits the overflow field when there are 10 or fewer members', () => {
    const characters = Array.from({ length: 10 }, (_, i) =>
      buildGuildCharacter({ character_id: `${i}`, name: `Member ${i}` }),
    );
    const guild = buildGuild({ characters });
    const fields = buildGuildEmbed(guild).toJSON().fields ?? [];

    expect(fields.some((field) => field.value.includes('more'))).toBe(false);
  });
});
