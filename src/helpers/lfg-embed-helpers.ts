import { ActionRowBuilder, ButtonBuilder, ButtonStyle, type EmbedBuilder } from 'discord.js';
import { buildEmbed } from './embed-helpers';

export interface LfgRole {
  key: string;
  label: string;
  emoji: string;
  amount: number;
}

export const buildLfgEmbed = (
  instanceName: string,
  createdBy: string,
  roles: LfgRole[],
): EmbedBuilder =>
  buildEmbed()
    .setTitle(`:mag: LFG ${instanceName}`)
    .setDescription(`Created by \`${createdBy}\`.`)
    .addFields(
      ...roles.map((role) => ({
        name: `${role.emoji} ${role.label} (0/${role.amount})`,
        value: '-',
        inline: false,
      })),
    );

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
