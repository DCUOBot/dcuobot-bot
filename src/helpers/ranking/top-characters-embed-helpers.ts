import type { EmbedBuilder } from 'discord.js';
import type { Character } from '../../models/characters/character';
import { buildRankingEmbed, buildRankingUrl } from './ranking-embed-helpers';
import { getCharacterStatBySort } from '../sort-helpers';

const TOP_CHARACTERS_URL_PATH = '/characters/ranking';

export const buildTopCharactersUrl = (worldId: number, sort: string): string =>
  buildRankingUrl(TOP_CHARACTERS_URL_PATH, worldId, sort);

export const buildTopCharactersEmbed = (
  characters: Character[],
  worldId: number,
  sort: string,
): EmbedBuilder =>
  buildRankingEmbed({
    items: characters,
    worldId,
    sort,
    title: ':bar_chart: Top Characters',
    urlPath: TOP_CHARACTERS_URL_PATH,
    listEmoji: ':bust_in_silhouette:',
    getStat: getCharacterStatBySort,
  });
