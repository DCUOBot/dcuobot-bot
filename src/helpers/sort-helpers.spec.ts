import { describe, expect, it } from 'vitest';
import {
  getApiSortByBotSort,
  getCharacterStatBySort,
  getSortEmoji,
  getSortLabel,
} from './sort-helpers';
import type { Character } from '../models/characters/character';

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
