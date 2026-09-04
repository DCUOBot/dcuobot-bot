import { describe, expect, it, vi } from 'vitest';
import { buildTopCharactersEmbed, buildTopCharactersUrl } from './top-characters-embed-helpers';
import type { Character } from '../models/characters/character';

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

const buildCharacter = (overrides: Partial<Character> = {}): Character => ({
  character_id: '1',
  name: 'Batman',
  world_id: '2',
  personality: 'Brooding',
  alignment: 'Hero',
  gender: 'Male',
  power_type: 'Gadgets',
  movement_mode: 'Acrobatics',
  skill_points: 250,
  combat_rating: 400,
  pvp_combat_rating: 380,
  allies: [],
  artifacts: [],
  guild: { id: '1', name: 'Justice League' },
  image: { url: 'https://example.com/batman.png', alt_url: 'https://example.com/batman-alt.png' },
  stats: {
    health: 1,
    power: 1,
    might: 1,
    precision: 1,
    defense: 1,
    dominance: 1,
    toughness: 1,
    restoration: 1,
    vitalization: 1,
  },
  ...overrides,
});

describe('buildTopCharactersUrl', () => {
  it('points at the frontend ranking page with worldId and sort params', () => {
    expect(buildTopCharactersUrl(2, 'sp')).toBe(
      'https://dcuo.bot/characters/ranking?worldId=2&sort=skill_points',
    );
  });

  it('translates the bot sort key to the API sort name', () => {
    const url = new URL(buildTopCharactersUrl(0, 'health'));

    expect(url.searchParams.get('sort')).toBe('max_health');
  });
});

describe('buildTopCharactersEmbed', () => {
  it('sets title and url', () => {
    const embed = buildTopCharactersEmbed([], 2, 'sp').toJSON();

    expect(embed.title).toBe(':bar_chart: Top Characters');
    expect(embed.url).toBe(buildTopCharactersUrl(2, 'sp'));
  });

  it('describes the specific server when a worldId is selected', () => {
    const embed = buildTopCharactersEmbed([], 2, 'sp').toJSON();

    expect(embed.description).toBe('Server: USPC/PS');
  });

  it('describes "All Servers" for worldId 0', () => {
    const embed = buildTopCharactersEmbed([], 0, 'sp').toJSON();

    expect(embed.description).toBe('Server: All Servers');
  });

  it('applies the shared embed styling (color, author, timestamp)', () => {
    const embed = buildTopCharactersEmbed([], 2, 'sp').toJSON();

    expect(embed.color).toBe(Number.parseInt('9B59B6', 16));
    expect(embed.author).toEqual({ name: 'DCUOBot', icon_url: 'https://example.com/icon.png' });
    expect(embed.timestamp).toBeTruthy();
  });

  it('propagates an error for an unrecognized world ID', () => {
    expect(() => buildTopCharactersEmbed([], 9999, 'sp')).toThrow('Invalid world ID.');
  });

  it('renders a ranked field per character with the sorted stat', () => {
    const character = buildCharacter({ name: 'Batman', skill_points: 250 });
    const fields = buildTopCharactersEmbed([character], 2, 'sp').toJSON().fields ?? [];

    expect(fields[0]?.name).toBe(':bust_in_silhouette: 1. Batman');
    expect(fields[0]?.value).toBe(':chart_with_upwards_trend: Skill Points: **250**');
  });

  it('omits the server suffix when a specific world is selected', () => {
    const character = buildCharacter({ name: 'Batman', world_id: '2' });
    const fields = buildTopCharactersEmbed([character], 2, 'sp').toJSON().fields ?? [];

    expect(fields[0]?.name).toBe(':bust_in_silhouette: 1. Batman');
  });

  it("appends the character's server when ranking across all servers", () => {
    const character = buildCharacter({ name: 'Batman', world_id: '4' });
    const fields = buildTopCharactersEmbed([character], 0, 'sp').toJSON().fields ?? [];

    expect(fields[0]?.name).toBe(':bust_in_silhouette: 1. Batman (EUPC/PS)');
  });

  it('numbers fields in ranking order', () => {
    const characters = [
      buildCharacter({ character_id: '1', name: 'First' }),
      buildCharacter({ character_id: '2', name: 'Second' }),
    ];
    const fields = buildTopCharactersEmbed(characters, 2, 'sp').toJSON().fields ?? [];

    expect(fields.map((field) => field.name)).toEqual([
      ':bust_in_silhouette: 1. First',
      ':bust_in_silhouette: 2. Second',
    ]);
  });

  it('renders at most 10 character fields', () => {
    const characters = Array.from({ length: 12 }, (_, index) =>
      buildCharacter({ character_id: `${index}`, name: `Character ${index}` }),
    );
    const fields = buildTopCharactersEmbed(characters, 2, 'sp').toJSON().fields ?? [];

    expect(fields).toHaveLength(10);
    expect(fields.map((field) => field.name)).not.toContain(
      ':bust_in_silhouette: 11. Character 10',
    );
  });

  it('propagates an error for an unrecognized sort', () => {
    const character = buildCharacter();

    expect(() => buildTopCharactersEmbed([character], 2, 'bogus')).toThrow('Invalid sort.');
  });
});
