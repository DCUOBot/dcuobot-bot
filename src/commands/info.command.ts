import type { Command } from '../types/command';
import { type ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { getSystemInfo } from '../helpers/system-info-helpers';
import { buildInfoEmbed } from '../helpers/info-embed-helpers';

const command: Command = {
  data: new SlashCommandBuilder().setName('info').setDescription('Information about DCUOBot.'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    const systemInfo = getSystemInfo(interaction.client);
    const embed = buildInfoEmbed(systemInfo);

    await interaction.editReply({
      embeds: [embed],
    });
  },
};

export default command;
