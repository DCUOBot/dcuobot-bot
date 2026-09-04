import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type APIEmbedField,
  type EmbedBuilder,
} from 'discord.js';
import { buildEmbed } from './embed-helpers';

export const EMPTY_SLOT = '-';

export interface LfgRole {
  key: string;
  label: string;
  emoji: string;
  maxAmount: number;
  slots: string[];
}

export const countFilledSlots = (slots: string[]): number =>
  slots.filter((slot) => slot !== EMPTY_SLOT).length;

export const buildLfgRoleFields = (roles: LfgRole[]): APIEmbedField[] =>
  roles.map((role) => ({
    name: `${role.emoji} ${role.label} (${countFilledSlots(role.slots)}/${role.maxAmount})`,
    value: role.slots.join('\n'),
    inline: false,
  }));

export const buildLfgEmbed = (
  instanceName: string,
  createdBy: string,
  roles: LfgRole[],
): EmbedBuilder =>
  buildEmbed()
    .setTitle(`:mag: LFG ${instanceName}`)
    .setDescription(`Created by \`${createdBy}\`.`)
    .addFields(...buildLfgRoleFields(roles));

export const buildLfgActionRow = (
  interactionId: string,
  roles: LfgRole[],
): ActionRowBuilder<ButtonBuilder> =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    ...roles.map((role) =>
      new ButtonBuilder()
        .setCustomId(`${role.key}-${interactionId}`)
        .setLabel(role.label)
        .setEmoji(role.emoji)
        .setStyle(ButtonStyle.Secondary),
    ),
    new ButtonBuilder()
      .setCustomId(`signOut-${interactionId}`)
      .setLabel('Sign out')
      .setStyle(ButtonStyle.Danger),
  );
