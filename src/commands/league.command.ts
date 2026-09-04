import { apiClient } from '../lib/api-client';
import { buildGuildEmbed } from '../helpers/guild/guild-embed-helpers';
import { buildLookupCommand } from '../handlers/build-lookup-command';

const command = buildLookupCommand({
  name: 'league',
  description: 'Look up a leagues average skill points, members, etc.',
  nameOptionDescription: 'The name of the league to look up.',
  serverOptionDescription: 'The server the league is on.',
  fetch: (name, worldId) => apiClient.getGuild(name, worldId),
  buildEmbed: (_interaction, guild) => buildGuildEmbed(guild),
});

export default command;
