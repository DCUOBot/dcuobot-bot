import type { Command } from '../types/command';
import { type ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { apiClient, ApiError } from '../lib/api-client';
import { getApiSortByBotSort } from '../helpers/sort-helpers';
import { getOptionalWorldIdByServer } from '../helpers/world-id-helpers';
import { buildTopCharactersEmbed } from '../helpers/top-characters-embed-helpers';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('topcharacters')
    .setDescription('See the top characters ranking.')
    .addStringOption((option) =>
      option
        .setName('server')
        .setDescription('The server to get the characters ranking of.')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName('sortby').setDescription('The stat to sort characters by.').setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const server = interaction.options.getString('server', true);
    const sortBy = interaction.options.getString('sortby', true);

    try {
      await interaction.deferReply();

      const worldId = getOptionalWorldIdByServer(server);
      const characters = await apiClient.getCharactersRanking(worldId, getApiSortByBotSort(sortBy));
      const embed = buildTopCharactersEmbed(characters, worldId, sortBy);

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
};

export default command;
