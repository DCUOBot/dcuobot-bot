import type { EmbedBuilder } from 'discord.js';
import { buildEmbed } from './embed-helpers';
import { config } from '../lib/config';
import { getApiSortByBotSort, getSortEmoji, getSortLabel } from './sort-helpers';
import { getServerByOptionalWorldId, getServerByWorldId } from './world-id-helpers';

const MAX_DISPLAYED_ITEMS = 10;

interface RankingItem {
  name: string;
  world_id: string;
}

interface BuildRankingEmbedOptions<T extends RankingItem> {
  items: T[];
  worldId: number;
  sort: string;
  title: string;
  urlPath: string;
  listEmoji: string;
  getStat: (sort: string, item: T) => number;
}

export const buildRankingUrl = (urlPath: string, worldId: number, sort: string): string => {
  const url = new URL(urlPath, config.frontendUrl);
  url.searchParams.set('worldId', worldId.toString());
  url.searchParams.set('sort', getApiSortByBotSort(sort));

  return url.toString();
};

export const buildRankingEmbed = <T extends RankingItem>({
  items,
  worldId,
  sort,
  title,
  urlPath,
  listEmoji,
  getStat,
}: BuildRankingEmbedOptions<T>): EmbedBuilder => {
  const showServer = worldId === 0;

  const fields = items.slice(0, MAX_DISPLAYED_ITEMS).map((item, index) => ({
    name:
      `${listEmoji} ${index + 1}. ${item.name}` +
      (showServer ? ` (${getServerByWorldId(+item.world_id)})` : ''),
    value: `${getSortEmoji(sort)} ${getSortLabel(sort)}: **${getStat(sort, item).toLocaleString()}**`,
    inline: false,
  }));

  return buildEmbed()
    .setTitle(title)
    .setURL(buildRankingUrl(urlPath, worldId, sort))
    .setDescription(`Server: ${getServerByOptionalWorldId(worldId)}`)
    .addFields(...fields);
};
