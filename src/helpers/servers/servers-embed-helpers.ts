import type { GameServer } from '../../models/game-servers/game-server';
import { buildEmbed } from '../embed-helpers';
import type { EmbedBuilder } from 'discord.js';

const getServerName = (server: GameServer): string => {
  switch (server.server_name.toLowerCase()) {
    case 'us':
      return 'USPC/PS';
    case 'eu':
      return 'EUPC/PS';
    case 'us xbox':
      return 'Xbox';
  }

  return server.server_name;
};

const getServerStatusEmoji = (server: GameServer): string => {
  switch (server.status.toLowerCase()) {
    case 'online':
      return ':green_square:';
    case 'locked':
      return ':orange_square:';
    case 'offline':
      return ':red_square:';
  }

  return '';
};

const getServerStatusLabel = (server: GameServer): string => {
  switch (server.status.toLowerCase()) {
    case 'online':
      return 'Online';
    case 'locked':
      return 'Locked';
    case 'offline':
      return 'Offline';
  }

  return server.status;
};

export const buildServersEmbed = (gameServers: GameServer[]): EmbedBuilder => {
  const embed = buildEmbed()
    .setTitle(':desktop: DCUO Servers Status')
    .setDescription('All Servers');

  for (const server of gameServers) {
    embed.addFields({
      name: `:map: ${getServerName(server)}`,
      value:
        `${getServerStatusEmoji(server)} **${getServerStatusLabel(server)}**\n` +
        `Population: **${server.population.toUpperCase()}**`,
    });
  }

  return embed;
};
