import { apiClient } from '../lib/api-client';
import { buildStatisticsEmbed } from '../helpers/character/character-embed-helpers';
import { buildLookupCommand } from '../handlers/build-lookup-command';

const command = buildLookupCommand({
  name: 'statistics',
  description: 'Look up a characters stats (health, power, might, etc.).',
  nameOptionDescription: 'The name of the character to look up.',
  serverOptionDescription: 'The server the character is on.',
  fetch: (name, worldId) => apiClient.getCharacter(name, worldId),
  buildEmbed: (_interaction, character) => buildStatisticsEmbed(character),
});

export default command;
