import type { EmbedBuilder } from 'discord.js';
import { buildEmbed } from './embed-helpers';
import { config } from '../lib/config';
import {
  getApiSortByBotSort,
  getCharacterStatBySort,
  getSortEmoji,
  getSortLabel,
} from './sort-helpers';
import { getServerByOptionalWorldId, getServerByWorldId } from './world-id-helpers';
import type { Character } from '../models/characters/character';

const MAX_DISPLAYED_CHARACTERS = 10;

export const buildTopCharactersUrl = (worldId: number, sort: string): string => {
  const url = new URL('/characters/ranking', config.frontendUrl);
  url.searchParams.set('worldId', worldId.toString());
  url.searchParams.set('sort', getApiSortByBotSort(sort));

  return url.toString();
};

export const buildTopCharactersEmbed = (
  characters: Character[],
  worldId: number,
  sort: string,
): EmbedBuilder => {
  const showServer = worldId === 0;

  const characterFields = characters.slice(0, MAX_DISPLAYED_CHARACTERS).map((character, index) => ({
    name:
      `:bust_in_silhouette: ${index + 1}. ${character.name}` +
      (showServer ? ` (${getServerByWorldId(+character.world_id)})` : ''),
    value: `${getSortEmoji(sort)} ${getSortLabel(sort)}: **${getCharacterStatBySort(sort, character).toLocaleString()}**`,
    inline: false,
  }));

  return buildEmbed()
    .setTitle(':bar_chart: Top Characters')
    .setURL(buildTopCharactersUrl(worldId, sort))
    .setDescription(`Server: ${getServerByOptionalWorldId(worldId)}`)
    .addFields(...characterFields);
};
