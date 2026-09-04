import type { Command } from '../types/command';
import { type ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import {
  buildLfgActionRow,
  buildLfgEmbed,
  EMPTY_SLOT,
  type LfgRole,
} from '../helpers/lfg/lfg-embed-helpers';
import { LFG_ROLES } from '../helpers/lfg/lfg-roles';

const MIN_GROUP_SIZE = 4;
const MAX_GROUP_SIZE = 8;

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('lfg')
    .setDescription('Create a looking for group embed.')
    .addStringOption((option) =>
      option.setName('instance_name').setDescription('The name of the instance.').setRequired(true),
    )
    .addIntegerOption((option) =>
      option.setName('amount_of_tanks').setDescription('The amount of tanks.').setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName('amount_of_healers')
        .setDescription('The amount of healers.')
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName('amount_of_controllers')
        .setDescription('The amount of controllers.')
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option.setName('amount_of_dps').setDescription('The amount of DPS.').setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const instanceName = interaction.options.getString('instance_name', true);

    const amounts = LFG_ROLES.map((role) => ({
      ...role,
      amount: interaction.options.getInteger(role.optionName, true),
    }));

    const invalidRole = amounts.find((role) => role.amount < 0);

    if (invalidRole) {
      await interaction.reply(`Amount of ${invalidRole.pluralLabel} cannot be less than 0.`);
      return;
    }

    const groupSize = amounts.reduce((total, role) => total + role.amount, 0);

    if (groupSize < MIN_GROUP_SIZE || groupSize > MAX_GROUP_SIZE) {
      await interaction.reply(
        `The group size must be between ${MIN_GROUP_SIZE} and ${MAX_GROUP_SIZE}.`,
      );
      return;
    }

    const roles: LfgRole[] = amounts.map((role) => ({
      key: role.key,
      label: role.label,
      emoji: role.emoji,
      maxAmount: role.amount,
      slots: [EMPTY_SLOT],
    }));

    const embed = buildLfgEmbed(instanceName, interaction.user.username, roles);
    const row = buildLfgActionRow(interaction.id, roles);

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });
  },
};

export default command;
