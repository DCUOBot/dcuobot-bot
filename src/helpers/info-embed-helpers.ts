import type { EmbedBuilder } from 'discord.js';
import { buildEmbed } from './embed-helpers';
import type { SystemInfo } from './system-info-helpers';

const formatDiscordPing = (discordPingMs: number): string =>
  discordPingMs >= 0 ? `${discordPingMs} ms` : 'Calculating...';

const formatUptime = (uptimeMs: number): string => {
  const totalSeconds = Math.floor(uptimeMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    days > 0 ? `${days}d` : null,
    hours > 0 ? `${hours}h` : null,
    minutes > 0 ? `${minutes}m` : null,
    `${seconds}s`,
  ]
    .filter((part) => part !== null)
    .join(' ');
};

export const buildInfoEmbed = (systemInfo: SystemInfo): EmbedBuilder =>
  buildEmbed()
    .setTitle('DCUOBot Information')
    .setDescription('Technical information about DCUOBot.')
    .addFields(
      {
        name: ':ping_pong: Discord API Ping',
        value: formatDiscordPing(systemInfo.discordPingMs),
        inline: true,
      },
      {
        name: ':stopwatch: Bot Uptime',
        value: formatUptime(systemInfo.uptimeMs),
        inline: true,
      },
    );
