import { apiClient } from '../lib/api-client';
import { buildTopLeaguesEmbed } from '../helpers/top-leagues-embed-helpers';
import { buildRankingCommand } from '../handlers/build-ranking-command';

const command = buildRankingCommand({
  name: 'topleagues',
  description: 'See the top leagues ranking.',
  serverOptionDescription: 'The server to get the leagues ranking of.',
  sortOptionDescription: 'The stat to sort leagues by.',
  fetch: (worldId, sort) => apiClient.getGuildsRanking(worldId, sort),
  buildEmbed: buildTopLeaguesEmbed,
});

export default command;
