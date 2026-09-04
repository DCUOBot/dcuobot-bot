import type { Command } from '../types/command';
import { type ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { BotClient } from '../structures/bot-client';
import { buildCommandsEmbed } from '../helpers/commands-embed-helpers';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('dcuobot')
    .setDescription('See a list of available commands.'),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();

    const { commands } = interaction.client as BotClient;
    const embed = buildCommandsEmbed([...commands.values()]);

    await interaction.editReply({
      embeds: [embed],
    });
  },
};

export default command;
