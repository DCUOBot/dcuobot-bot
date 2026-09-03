import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { apiClient, ApiError } from '../lib/api-client';
import type { Command } from '../types/command';
import { getWorldIdByServer } from '../helpers/world-id-helpers';
import { buildCharacterEmbed } from '../helpers/character-embed-helpers';

const isExactMatch = (characterName: string, query: string): boolean =>
  characterName.trim().toLowerCase() === query.trim().toLowerCase();

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('character')
    .setDescription('Look up a characters skill points, combat rating and more.')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('The name of the character to look up.')
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName('server')
        .setDescription('The server the character is on.')
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const name = interaction.options.getString('name', true);
    const server = interaction.options.getString('server', true);

    try {
      await interaction.deferReply();

      const character = await apiClient.getCharacter(name, getWorldIdByServer(server));
      const embed = buildCharacterEmbed(interaction.client, character);

      await interaction.editReply({
        content: isExactMatch(character.name, name)
          ? null
          : `Couldn't find a character with the name \`${name}\` (might be inactive/deleted, did you mean this one?`,
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
