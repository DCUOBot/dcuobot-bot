import { EmbedBuilder } from 'discord.js';
import { config } from '../lib/config';

export const buildEmbed = (): EmbedBuilder => {
  return new EmbedBuilder()
    .setColor(config.discord.embed.color)
    .setAuthor({ name: config.discord.embed.author, iconURL: config.discord.embed.image })
    .setTimestamp();
};
