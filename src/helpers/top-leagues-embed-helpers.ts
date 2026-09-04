import type { EmbedBuilder } from 'discord.js';
import type { Guild } from '../models/guilds/guild';
import { buildRankingEmbed, buildRankingUrl } from './ranking-embed-helpers';
import { getGuildStatBySort } from './sort-helpers';

const TOP_LEAGUES_URL_PATH = '/leagues/ranking';

export const buildTopLeaguesUrl = (worldId: number, sort: string): string =>
  buildRankingUrl(TOP_LEAGUES_URL_PATH, worldId, sort);

export const buildTopLeaguesEmbed = (
  guilds: Guild[],
  worldId: number,
  sort: string,
): EmbedBuilder =>
  buildRankingEmbed({
    items: guilds,
    worldId,
    sort,
    title: ':busts_in_silhouette: Top Leagues',
    urlPath: TOP_LEAGUES_URL_PATH,
    listEmoji: ':busts_in_silhouette:',
    getStat: getGuildStatBySort,
  });
