import type { Command } from '../types/command';
import { type ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { apiClient, ApiError } from '../lib/api-client';
import { getWorldIdByServer } from '../helpers/world-id-helpers';
import { buildGuildEmbed } from '../helpers/guild-embed-helpers';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('league')
    .setDescription('Look up a leagues average skill points, members, etc.')
    .addStringOption((option) =>
      option.setName('name').setDescription('The name of the league to look up.').setRequired(true),
    )
    .addStringOption((option) =>
      option.setName('server').setDescription('The server the league is on.').setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const name = interaction.options.getString('name', true);
    const server = interaction.options.getString('server', true);

    try {
      await interaction.deferReply();

      const guild = await apiClient.getGuild(name, getWorldIdByServer(server));
      const embed = buildGuildEmbed(guild);

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
