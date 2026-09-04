import type { Command } from '../types/command';
import { type ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { apiClient, ApiError } from '../lib/api-client';
import { buildServersEmbed } from '../helpers/servers/servers-embed-helpers';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('servers')
    .setDescription('Check the DC Universe Online servers status.'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      await interaction.deferReply();

      const gameServers = await apiClient.getGameServerStatus();
      const embed = buildServersEmbed(gameServers);

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
