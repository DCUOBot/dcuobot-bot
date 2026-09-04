import type { Client } from 'discord.js';

export interface SystemInfo {
  discordPingMs: number;
  uptimeMs: number;
}

export const getSystemInfo = (client: Client): SystemInfo => ({
  discordPingMs: Math.round(client.ws.ping),
  uptimeMs: client.uptime ?? 0,
});
