import { logger } from './logger';
import { GatewayIntentBits, type ColorResolvable } from 'discord.js';

const { DISCORD_TOKEN } = process.env;

if (!DISCORD_TOKEN) {
  logger.fatal('Missing DISCORD_TOKEN environment variable.');
  process.exit(1);
}

export const config = {
  discord: {
    botToken: DISCORD_TOKEN,
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildExpressions,
      GatewayIntentBits.GuildMessageReactions,
    ],
    embed: {
      color: '#9B59B6' as ColorResolvable,
      author: 'DCUOBot',
      image: 'https://avatars.githubusercontent.com/u/211105057',
    },
    emojis: {
      tank: '<:r_:1088024461778890772>',
      healer: '<:r_:1088024463070744698>',
      controller: '<:r_:1088024465008500788>',
      dps: '<:r_:1088024466291949599>',
    },
  },
  api: {
    baseUrl: 'https://dcuo.bot/api/v1/census',
  },
  frontendUrl: 'https://dcuo.bot',
};
