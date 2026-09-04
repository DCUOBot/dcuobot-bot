import type { Command } from '../types/command';
import { type ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { apiClient, ApiError } from '../lib/api-client';
import { getWorldIdByServer } from '../helpers/world-id-helpers';
import { buildStatisticsEmbed } from '../helpers/character-embed-helpers';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('statistics')
    .setDescription('Look up a characters stats (health, power, might, etc.).')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('The name of the character to look up.')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName('server').setDescription('The server the character is on.').setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const name = interaction.options.getString('name', true);
    const server = interaction.options.getString('server', true);

    try {
      await interaction.deferReply();

      const character = await apiClient.getCharacter(name, getWorldIdByServer(server));
      const embed = buildStatisticsEmbed(character);

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
