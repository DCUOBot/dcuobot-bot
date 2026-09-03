import type { Client } from 'discord.js';
import { describe, expect, it, vi } from 'vitest';
import { buildCharacterEmbed, buildCharacterUrl } from './character-embed-helpers';
import type { Ally } from '../models/characters/ally';
import type { Artifact } from '../models/characters/artifact';
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

const buildAlly = (overrides: Partial<Ally> = {}): Ally => ({
  id: '1',
  name: 'Robin',
  combat: false,
  ...overrides,
});

const buildArtifact = (overrides: Partial<Artifact> = {}): Artifact => ({
  id: '1',
  name: 'Soul of Zamaraan',
  discord_emoji_id: '111',
  image_url: 'https://example.com/artifact.png',
  ...overrides,
});

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

const buildClient = (emojis: Record<string, string> = {}): Client => {
  const cache = new Map(
    Object.entries(emojis).map(([id, mention]) => [id, { toString: () => mention }]),
  );

  return { emojis: { cache } } as unknown as Client;
};

const findField = (fields: { name: string; value: string; inline?: boolean }[], name: string) => {
  const field = fields.find((candidate) => candidate.name === name);

  if (!field) {
    throw new Error(`Field "${name}" not found`);
  }

  return field;
};

describe('buildCharacterUrl', () => {
  it('points at the frontend character page with a query and worldId param', () => {
    const character = buildCharacter({ name: 'Batman', world_id: '2' });

    expect(buildCharacterUrl(character)).toBe('https://dcuo.bot/characters?query=Batman&worldId=2');
  });

  it('URL-encodes special characters in the character name', () => {
    const character = buildCharacter({ name: 'Bat Man & Robin?' });

    const url = new URL(buildCharacterUrl(character));

    expect(url.searchParams.get('query')).toBe('Bat Man & Robin?');
    expect(url.toString()).not.toContain(' ');
  });
});

describe('buildCharacterEmbed', () => {
  it('sets title, url, description and thumbnail from the character', () => {
    const character = buildCharacter({ name: 'Batman', world_id: '2' });
    const embed = buildCharacterEmbed(buildClient(), character).toJSON();

    expect(embed.title).toBe(':bust_in_silhouette: Batman');
    expect(embed.url).toBe(buildCharacterUrl(character));
    expect(embed.description).toBe('Server: USPC/PS');
    expect(embed.thumbnail?.url).toBe('https://example.com/batman.png');
  });

  it('applies the shared embed styling (color, author, timestamp)', () => {
    const embed = buildCharacterEmbed(buildClient(), buildCharacter()).toJSON();

    expect(embed.color).toBe(Number.parseInt('9B59B6', 16));
    expect(embed.author).toEqual({ name: 'DCUOBot', icon_url: 'https://example.com/icon.png' });
    expect(embed.timestamp).toBeTruthy();
  });

  it('propagates an error for an unrecognized world ID', () => {
    const character = buildCharacter({ world_id: '9999' });

    expect(() => buildCharacterEmbed(buildClient(), character)).toThrow('Invalid world ID.');
  });

  it('renders basic stat fields', () => {
    const character = buildCharacter({
      skill_points: 250,
      combat_rating: 400,
      pvp_combat_rating: 380,
      gender: 'Male',
      power_type: 'Gadgets',
      alignment: 'Hero',
      personality: 'Brooding',
      movement_mode: 'Acrobatics',
    });
    const fields = buildCharacterEmbed(buildClient(), character).toJSON().fields ?? [];

    expect(findField(fields, ':chart_with_upwards_trend: Skill Points').value).toBe('250\u200B');
    expect(findField(fields, ':dagger: PVE CR').value).toBe('400\u200B');
    expect(findField(fields, ':crossed_swords: PVP CR').value).toBe('380\u200B');
    expect(findField(fields, ':male_sign: Gender').value).toBe('Male\u200B');
    expect(findField(fields, ':dna: Power').value).toBe('Gadgets\u200B');
    expect(findField(fields, ':supervillain: Alignment').value).toBe('Hero\u200B');
    expect(findField(fields, ':performing_arts: Personality').value).toBe('Brooding\u200B');
    expect(findField(fields, ':man_running: Movement').value).toBe('Acrobatics\u200B');
  });

  it('shows the league name when a guild is present', () => {
    const character = buildCharacter({ guild: { id: '1', name: 'Justice League' } });
    const fields = buildCharacterEmbed(buildClient(), character).toJSON().fields ?? [];

    expect(findField(fields, ':busts_in_silhouette: League').value).toBe('Justice League\u200B');
  });

  it('falls back to "-" for the league when there is no guild', () => {
    const character = buildCharacter({ guild: undefined as unknown as Character['guild'] });
    const fields = buildCharacterEmbed(buildClient(), character).toJSON().fields ?? [];

    expect(findField(fields, ':busts_in_silhouette: League').value).toBe('-\u200B');
  });

  it('renders "No Artifact" for every empty artifact slot', () => {
    const character = buildCharacter({ artifacts: [] });
    const fields = buildCharacterEmbed(buildClient(), character).toJSON().fields ?? [];

    for (const ordinal of ['One', 'Two', 'Three', 'Four', 'Five']) {
      expect(findField(fields, `:amphora: Artifact ${ordinal}`).value).toBe('No Artifact');
    }
  });

  it('renders artifact name with its emoji when the emoji is cached on the client', () => {
    const artifact = buildArtifact({ name: 'Soul of Zamaraan', discord_emoji_id: '111' });
    const character = buildCharacter({ artifacts: [artifact] });
    const client = buildClient({ '111': '<:soulofzamaraan:111>' });

    const fields = buildCharacterEmbed(client, character).toJSON().fields ?? [];

    expect(findField(fields, ':amphora: Artifact One').value).toBe(
      '<:soulofzamaraan:111> Soul of Zamaraan',
    );
  });

  it('renders just the artifact name when its emoji is not cached on the client', () => {
    const artifact = buildArtifact({ name: 'Soul of Zamaraan', discord_emoji_id: '111' });
    const character = buildCharacter({ artifacts: [artifact] });

    const fields = buildCharacterEmbed(buildClient(), character).toJSON().fields ?? [];

    expect(findField(fields, ':amphora: Artifact One').value).toBe('Soul of Zamaraan');
  });

  it('fills artifact slots in order and leaves the rest as "No Artifact"', () => {
    const character = buildCharacter({
      artifacts: [buildArtifact({ name: 'First' }), buildArtifact({ name: 'Second' })],
    });
    const fields = buildCharacterEmbed(buildClient(), character).toJSON().fields ?? [];

    expect(findField(fields, ':amphora: Artifact One').value).toBe('First');
    expect(findField(fields, ':amphora: Artifact Two').value).toBe('Second');
    expect(findField(fields, ':amphora: Artifact Three').value).toBe('No Artifact');
  });

  it('shows "-" for combat/support allies when none are present', () => {
    const character = buildCharacter({ allies: [] });
    const fields = buildCharacterEmbed(buildClient(), character).toJSON().fields ?? [];

    expect(findField(fields, ':superhero: Combat Ally').value).toBe('-');
    expect(findField(fields, ':superhero: Support Ally One').value).toBe('-');
    expect(findField(fields, ':superhero: Support Ally Two').value).toBe('-');
  });

  it('picks the combat ally and the first two support allies in order', () => {
    const character = buildCharacter({
      allies: [
        buildAlly({ name: 'Support A', combat: false }),
        buildAlly({ name: 'Combat Ally', combat: true }),
        buildAlly({ name: 'Support B', combat: false }),
        buildAlly({ name: 'Support C (overflow)', combat: false }),
      ],
    });
    const fields = buildCharacterEmbed(buildClient(), character).toJSON().fields ?? [];

    expect(findField(fields, ':superhero: Combat Ally').value).toBe('Combat Ally');
    expect(findField(fields, ':superhero: Support Ally One').value).toBe('Support A');
    expect(findField(fields, ':superhero: Support Ally Two').value).toBe('Support B');
  });
});
