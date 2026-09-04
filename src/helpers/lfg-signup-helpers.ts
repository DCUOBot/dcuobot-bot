import { type ButtonInteraction, MessageFlags } from 'discord.js';
import { buildEmbed } from './embed-helpers';
import {
  buildLfgRoleFields,
  countFilledSlots,
  EMPTY_SLOT,
  type LfgRole,
} from './lfg-embed-helpers';
import { LFG_ROLES, type LfgRoleKey } from './lfg-roles';

const CAPACITY_PATTERN = /\((\d+)\/(\d+)\)/;

type Rosters = Record<LfgRoleKey, string[]>;
type MaxAmounts = Record<LfgRoleKey, number>;

const parseMaxAmount = (fieldName: string): number | null => {
  const match = CAPACITY_PATTERN.exec(fieldName);
  return match ? Number(match[2]) : null;
};

const parseLfgState = (
  fields: readonly { name: string; value: string }[],
): { maxAmounts: MaxAmounts; rosters: Rosters } | null => {
  const maxAmounts = {} as MaxAmounts;
  const rosters = {} as Rosters;

  for (const role of LFG_ROLES) {
    const field = fields.find((candidate) => candidate.name.startsWith(role.emoji));
    const maxAmount = field ? parseMaxAmount(field.name) : null;

    if (!field || maxAmount === null) {
      return null;
    }

    maxAmounts[role.key] = maxAmount;
    rosters[role.key] = field.value.split('\n');
  }

  return { maxAmounts, rosters };
};

const removeUserFromRosters = (rosters: Rosters, user: string): Set<LfgRoleKey> => {
  const removedFrom = new Set<LfgRoleKey>();

  for (const role of LFG_ROLES) {
    const roster = rosters[role.key];

    if (roster.includes(user)) {
      removedFrom.add(role.key);
      const remaining = roster.filter((entry) => entry !== user);
      rosters[role.key] = remaining.length === 0 ? [EMPTY_SLOT] : remaining;
    }
  }

  return removedFrom;
};

export const handleLfgSignup = async (
  interaction: ButtonInteraction,
  roleKey: LfgRoleKey | null,
): Promise<void> => {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const oldEmbed = interaction.message.embeds[0];

  if (!oldEmbed) {
    await interaction.editReply('There is no embed to edit.');
    return;
  }

  const state = parseLfgState(oldEmbed.fields);

  if (!state) {
    await interaction.editReply('This LFG embed could not be read.');
    return;
  }

  const { maxAmounts, rosters } = state;
  const user = interaction.user.username;
  let confirmationMessage: string;

  if (roleKey === null) {
    const removedFrom = removeUserFromRosters(rosters, user);

    if (removedFrom.size === 0) {
      await interaction.editReply("You aren't signed up.");
      return;
    }

    confirmationMessage = 'You have signed out.';
  } else {
    const role = LFG_ROLES.find((candidate) => candidate.key === roleKey);

    if (!role) {
      await interaction.editReply('Unknown role.');
      return;
    }

    const alreadyInRole = rosters[roleKey].includes(user);

    if (!alreadyInRole && countFilledSlots(rosters[roleKey]) >= maxAmounts[roleKey]) {
      await interaction.editReply(`There are no ${role.pluralLabel} spots left.`);
      return;
    }

    removeUserFromRosters(rosters, user);

    if (alreadyInRole) {
      confirmationMessage = 'You have signed out.';
    } else {
      rosters[roleKey] = rosters[roleKey].includes(EMPTY_SLOT)
        ? [user]
        : [...rosters[roleKey], user];
      confirmationMessage = `You have signed up as ${role.label}.`;
    }
  }

  const updatedRoles: LfgRole[] = LFG_ROLES.map((role) => ({
    key: role.key,
    label: role.label,
    emoji: role.emoji,
    maxAmount: maxAmounts[role.key],
    slots: rosters[role.key],
  }));

  const embed = buildEmbed()
    .setTitle(oldEmbed.title)
    .setDescription(oldEmbed.description)
    .addFields(...buildLfgRoleFields(updatedRoles));

  await interaction.message.edit({ embeds: [embed] });
  await interaction.editReply(confirmationMessage);
};
