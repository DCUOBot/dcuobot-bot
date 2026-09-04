import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type EmbedBuilder,
} from 'discord.js';
import { ApiError } from '../lib/api-client';
import { getApiSortByBotSort } from '../helpers/sort-helpers';
import { getOptionalWorldIdByServer } from '../helpers/world-id-helpers';
import type { Command } from '../types/command';

interface RankingCommandOptions<T> {
  name: string;
  description: string;
  serverOptionDescription: string;
  sortOptionDescription: string;
  fetch: (worldId: number, sort: string) => Promise<T[]>;
  buildEmbed: (items: T[], worldId: number, sort: string) => EmbedBuilder;
}

export const buildRankingCommand = <T>(options: RankingCommandOptions<T>): Command => ({
  data: new SlashCommandBuilder()
    .setName(options.name)
    .setDescription(options.description)
    .addStringOption((option) =>
      option.setName('server').setDescription(options.serverOptionDescription).setRequired(true),
    )
    .addStringOption((option) =>
      option.setName('sortby').setDescription(options.sortOptionDescription).setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const server = interaction.options.getString('server', true);
    const sortBy = interaction.options.getString('sortby', true);

    try {
      await interaction.deferReply();

      const worldId = getOptionalWorldIdByServer(server);
      const items = await options.fetch(worldId, getApiSortByBotSort(sortBy));
      const embed = options.buildEmbed(items, worldId, sortBy);

      await interaction.editReply({
        embeds: [embed],
      });
    } catch (error) {
      if (error instanceof ApiError) {
        await interaction.editReply(error.message);
        return;
      }

      throw error;
    }
  },
});
