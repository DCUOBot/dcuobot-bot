import { describe, expect, it, vi } from 'vitest';
import { buildTopLeaguesEmbed, buildTopLeaguesUrl } from './top-leagues-embed-helpers';
import type { Guild } from '../../models/guilds/guild';

vi.mock('../../lib/config', () => ({
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

const buildGuild = (overrides: Partial<Guild> = {}): Guild => ({
  guild_id: '1',
  name: 'Justice League',
  world_id: '2',
  alignment: 'Hero',
  average_skill_points: 250,
  average_combat_rating: 400,
  average_pvp_combat_rating: 380,
  member_count: 12,
  characters: [],
  ...overrides,
});

describe('buildTopLeaguesUrl', () => {
  it('points at the frontend ranking page with worldId and sort params', () => {
    expect(buildTopLeaguesUrl(2, 'avgcr')).toBe(
      'https://dcuo.bot/leagues/ranking?worldId=2&sort=averageCombatRating',
    );
  });

  it('translates the bot sort key to the API sort name', () => {
    const url = new URL(buildTopLeaguesUrl(0, 'members'));

    expect(url.searchParams.get('sort')).toBe('memberCount');
  });
});

describe('buildTopLeaguesEmbed', () => {
  it('sets title and url', () => {
    const embed = buildTopLeaguesEmbed([], 2, 'avgcr').toJSON();

    expect(embed.title).toBe(':busts_in_silhouette: Top Leagues');
    expect(embed.url).toBe(buildTopLeaguesUrl(2, 'avgcr'));
  });

  it('describes the specific server when a worldId is selected', () => {
    const embed = buildTopLeaguesEmbed([], 2, 'avgcr').toJSON();

    expect(embed.description).toBe('Server: USPC/PS');
  });

  it('describes "All Servers" for worldId 0', () => {
    const embed = buildTopLeaguesEmbed([], 0, 'avgcr').toJSON();

    expect(embed.description).toBe('Server: All Servers');
  });

  it('applies the shared embed styling (color, author, timestamp)', () => {
    const embed = buildTopLeaguesEmbed([], 2, 'avgcr').toJSON();

    expect(embed.color).toBe(Number.parseInt('9B59B6', 16));
    expect(embed.author).toEqual({ name: 'DCUOBot', icon_url: 'https://example.com/icon.png' });
    expect(embed.timestamp).toBeTruthy();
  });

  it('propagates an error for an unrecognized world ID', () => {
    expect(() => buildTopLeaguesEmbed([], 9999, 'avgcr')).toThrow('Invalid world ID.');
  });

  it('renders a ranked field per guild with the sorted stat', () => {
    const guild = buildGuild({ name: 'Justice League', average_combat_rating: 400 });
    const fields = buildTopLeaguesEmbed([guild], 2, 'avgcr').toJSON().fields ?? [];

    expect(fields[0]?.name).toBe(':busts_in_silhouette: 1. Justice League');
    expect(fields[0]?.value).toBe(':dagger: Avg. Combat Rating: **400**');
  });

  it('omits the server suffix when a specific world is selected', () => {
    const guild = buildGuild({ name: 'Justice League', world_id: '2' });
    const fields = buildTopLeaguesEmbed([guild], 2, 'avgcr').toJSON().fields ?? [];

    expect(fields[0]?.name).toBe(':busts_in_silhouette: 1. Justice League');
  });

  it("appends the guild's server when ranking across all servers", () => {
    const guild = buildGuild({ name: 'Justice League', world_id: '4' });
    const fields = buildTopLeaguesEmbed([guild], 0, 'avgcr').toJSON().fields ?? [];

    expect(fields[0]?.name).toBe(':busts_in_silhouette: 1. Justice League (EUPC/PS)');
  });

  it('numbers fields in ranking order', () => {
    const guilds = [
      buildGuild({ guild_id: '1', name: 'First' }),
      buildGuild({ guild_id: '2', name: 'Second' }),
    ];
    const fields = buildTopLeaguesEmbed(guilds, 2, 'avgcr').toJSON().fields ?? [];

    expect(fields.map((field) => field.name)).toEqual([
      ':busts_in_silhouette: 1. First',
      ':busts_in_silhouette: 2. Second',
    ]);
  });

  it('renders at most 10 guild fields', () => {
    const guilds = Array.from({ length: 12 }, (_, index) =>
      buildGuild({ guild_id: `${index}`, name: `Guild ${index}` }),
    );
    const fields = buildTopLeaguesEmbed(guilds, 2, 'avgcr').toJSON().fields ?? [];

    expect(fields).toHaveLength(10);
    expect(fields.map((field) => field.name)).not.toContain(':busts_in_silhouette: 11. Guild 10');
  });

  it('propagates an error for an unrecognized sort', () => {
    const guild = buildGuild();

    expect(() => buildTopLeaguesEmbed([guild], 2, 'bogus')).toThrow('Invalid sort.');
  });
});
