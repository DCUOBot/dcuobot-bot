import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type EmbedBuilder,
} from 'discord.js';
import { ApiError } from '../lib/api-client';
import { getWorldIdByServer } from '../helpers/world-id-helpers';
import type { Command } from '../types/command';

interface LookupCommandOptions<T> {
  name: string;
  description: string;
  nameOptionDescription: string;
  serverOptionDescription: string;
  fetch: (name: string, worldId: number) => Promise<T>;
  buildEmbed: (interaction: ChatInputCommandInteraction, result: T) => EmbedBuilder;
  buildContent?: (result: T, query: string) => string | null;
}

export const buildLookupCommand = <T>(options: LookupCommandOptions<T>): Command => ({
  data: new SlashCommandBuilder()
    .setName(options.name)
    .setDescription(options.description)
    .addStringOption((option) =>
      option.setName('name').setDescription(options.nameOptionDescription).setRequired(true),
    )
    .addStringOption((option) =>
      option.setName('server').setDescription(options.serverOptionDescription).setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const name = interaction.options.getString('name', true);
    const server = interaction.options.getString('server', true);

    try {
      await interaction.deferReply();

      const result = await options.fetch(name, getWorldIdByServer(server));
      const embed = options.buildEmbed(interaction, result);

      await interaction.editReply({
        content: options.buildContent?.(result, name) ?? null,
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
