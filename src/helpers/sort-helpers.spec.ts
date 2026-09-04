import { describe, expect, it } from 'vitest';
import {
  getApiSortByBotSort,
  getCharacterStatBySort,
  getGuildStatBySort,
  getSortEmoji,
  getSortLabel,
} from './sort-helpers';
import type { Character } from '../models/characters/character';
import type { Guild } from '../models/guilds/guild';

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

describe('getApiSortByBotSort', () => {
  it.each([
    ['sp', 'skill_points'],
    ['cr', 'combat_rating'],
    ['pvpcr', 'pvp_combat_rating'],
    ['health', 'max_health'],
    ['power', 'max_power'],
    ['avgsp', 'averageSkillPoints'],
    ['avgcr', 'averageCombatRating'],
    ['avgpvpcr', 'averagePvpCombatRating'],
    ['members', 'memberCount'],
  ])('maps bot sort "%s" to API sort "%s"', (sort, apiSort) => {
    expect(getApiSortByBotSort(sort)).toBe(apiSort);
  });

  it('is case-insensitive', () => {
    expect(getApiSortByBotSort('SP')).toBe('skill_points');
  });

  it('falls back to the lowercased sort for stats without a dedicated API name', () => {
    expect(getApiSortByBotSort('Defense')).toBe('defense');
  });
});

describe('getSortEmoji', () => {
  it.each([
    ['sp', ':chart_with_upwards_trend:'],
    ['cr', ':dagger:'],
    ['pvpcr', ':crossed_swords:'],
    ['health', ':heart:'],
    ['power', ':zap:'],
    ['defense', ':shield:'],
    ['toughness', ':muscle:'],
    ['might', ':magic_wand:'],
    ['precision', ':dart:'],
    ['restoration', ':herb:'],
    ['vitalization', ':pill:'],
    ['dominance', ':chains:'],
    ['avgsp', ':chart_with_upwards_trend:'],
    ['avgcr', ':dagger:'],
    ['avgpvpcr', ':crossed_swords:'],
    ['members', ':1234:'],
  ])('maps sort "%s" to emoji "%s"', (sort, emoji) => {
    expect(getSortEmoji(sort)).toBe(emoji);
  });

  it('is case-insensitive', () => {
    expect(getSortEmoji('SP')).toBe(':chart_with_upwards_trend:');
  });

  it('throws for an unknown sort', () => {
    expect(() => getSortEmoji('bogus')).toThrow('Invalid sort.');
  });
});

describe('getSortLabel', () => {
  it.each([
    ['sp', 'Skill Points'],
    ['cr', 'Combat Rating'],
    ['pvpcr', 'PvP Combat Rating'],
    ['health', 'Health'],
    ['power', 'Power'],
    ['defense', 'Defense'],
    ['toughness', 'Toughness'],
    ['might', 'Might'],
    ['precision', 'Precision'],
    ['restoration', 'Restoration'],
    ['vitalization', 'Vitalization'],
    ['dominance', 'Dominance'],
    ['avgsp', 'Avg. Skill Points'],
    ['avgcr', 'Avg. Combat Rating'],
    ['avgpvpcr', 'Avg. PvP Combat Rating'],
    ['members', 'Members'],
  ])('maps sort "%s" to label "%s"', (sort, label) => {
    expect(getSortLabel(sort)).toBe(label);
  });

  it('is case-insensitive', () => {
    expect(getSortLabel('SP')).toBe('Skill Points');
  });

  it('throws for an unknown sort', () => {
    expect(() => getSortLabel('bogus')).toThrow('Invalid sort.');
  });
});

describe('getCharacterStatBySort', () => {
  it('reads direct character properties for sp, cr and pvpcr', () => {
    const character = buildCharacter({
      skill_points: 250,
      combat_rating: 400,
      pvp_combat_rating: 380,
    });

    expect(getCharacterStatBySort('sp', character)).toBe(250);
    expect(getCharacterStatBySort('cr', character)).toBe(400);
    expect(getCharacterStatBySort('pvpcr', character)).toBe(380);
  });

  it('reads stats fields for every other sort', () => {
    const character = buildCharacter({
      stats: {
        health: 11,
        power: 22,
        might: 33,
        precision: 44,
        defense: 55,
        dominance: 66,
        toughness: 77,
        restoration: 88,
        vitalization: 99,
      },
    });

    expect(getCharacterStatBySort('health', character)).toBe(11);
    expect(getCharacterStatBySort('power', character)).toBe(22);
    expect(getCharacterStatBySort('might', character)).toBe(33);
    expect(getCharacterStatBySort('precision', character)).toBe(44);
    expect(getCharacterStatBySort('defense', character)).toBe(55);
    expect(getCharacterStatBySort('dominance', character)).toBe(66);
    expect(getCharacterStatBySort('toughness', character)).toBe(77);
    expect(getCharacterStatBySort('restoration', character)).toBe(88);
    expect(getCharacterStatBySort('vitalization', character)).toBe(99);
  });

  it('returns a legitimate zero value instead of falling through to another field', () => {
    const character = buildCharacter({ skill_points: 0 });

    expect(getCharacterStatBySort('sp', character)).toBe(0);
  });

  it('is case-insensitive', () => {
    const character = buildCharacter({ combat_rating: 400 });

    expect(getCharacterStatBySort('CR', character)).toBe(400);
  });

  it('throws for an unknown sort', () => {
    const character = buildCharacter();

    expect(() => getCharacterStatBySort('bogus', character)).toThrow('Invalid sort.');
  });
});

describe('getGuildStatBySort', () => {
  it('reads the matching average/count field for each guild sort', () => {
    const guild = buildGuild({
      average_skill_points: 250,
      average_combat_rating: 400,
      average_pvp_combat_rating: 380,
      member_count: 12,
    });

    expect(getGuildStatBySort('avgsp', guild)).toBe(250);
    expect(getGuildStatBySort('avgcr', guild)).toBe(400);
    expect(getGuildStatBySort('avgpvpcr', guild)).toBe(380);
    expect(getGuildStatBySort('members', guild)).toBe(12);
  });

  it('returns a legitimate zero value instead of throwing', () => {
    const guild = buildGuild({ member_count: 0 });

    expect(getGuildStatBySort('members', guild)).toBe(0);
  });

  it('is case-insensitive', () => {
    const guild = buildGuild({ average_combat_rating: 400 });

    expect(getGuildStatBySort('AVGCR', guild)).toBe(400);
  });

  it('throws for an unknown sort', () => {
    const guild = buildGuild();

    expect(() => getGuildStatBySort('bogus', guild)).toThrow('Invalid sort.');
  });

  it('throws for a character-only sort', () => {
    const guild = buildGuild();

    expect(() => getGuildStatBySort('sp', guild)).toThrow('Invalid sort.');
  });
});
