import { apiClient } from '../lib/api-client';
import { buildTopCharactersEmbed } from '../helpers/ranking/top-characters-embed-helpers';
import { buildRankingCommand } from '../handlers/build-ranking-command';

const command = buildRankingCommand({
  name: 'topcharacters',
  description: 'See the top characters ranking.',
  serverOptionDescription: 'The server to get the characters ranking of.',
  sortOptionDescription: 'The stat to sort characters by.',
  fetch: (worldId, sort) => apiClient.getCharactersRanking(worldId, sort),
  buildEmbed: buildTopCharactersEmbed,
});

export default command;
