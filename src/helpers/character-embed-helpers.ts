import type { Client, EmbedBuilder } from 'discord.js';
import { buildEmbed } from './embed-helpers';
import { getServerByWorldId } from './world-id-helpers';
import { config } from '../lib/config';
import type { Character } from '../models/characters/character';
import type { Ally } from '../models/characters/ally';

const ARTIFACT_ORDINALS = ['One', 'Two', 'Three', 'Four', 'Five'] as const;
const ZWSP = '\u200B';

const getAllyName = (allies: Ally[], predicate: (ally: Ally) => boolean, index = 0): string =>
  allies.filter(predicate)[index]?.name ?? '-';

const buildArtifactField = (client: Client, character: Character, index: number) => {
  const artifact = character.artifacts[index];
  const name = `:amphora: Artifact ${ARTIFACT_ORDINALS[index]}`;

  if (!artifact) {
    return { name, value: 'No Artifact', inline: true };
  }

  const emoji = client.emojis.cache.get(artifact.discord_emoji_id)?.toString() ?? '';

  return { name, value: `${emoji} ${artifact.name}`.trim(), inline: true };
};

export const buildCharacterUrl = (character: Character): string => {
  const url = new URL('/characters', config.frontendUrl);
  url.searchParams.set('query', character.name);
  url.searchParams.set('worldId', character.world_id);

  return url.toString();
};

export const buildCharacterEmbed = (client: Client, character: Character): EmbedBuilder => {
  const artifactFields = ARTIFACT_ORDINALS.map((_, index) =>
    buildArtifactField(client, character, index),
  );

  return buildEmbed()
    .setTitle(`:bust_in_silhouette: ${character.name}`)
    .setURL(buildCharacterUrl(character))
    .setDescription(`Server: ${getServerByWorldId(+character.world_id)}`)
    .setThumbnail(character.image.url)
    .addFields(
      {
        name: ':chart_with_upwards_trend: Skill Points',
        value: `${character.skill_points}${ZWSP}`,
        inline: true,
      },
      { name: ':dagger: PVE CR', value: `${character.combat_rating}${ZWSP}`, inline: true },
      {
        name: ':crossed_swords: PVP CR',
        value: `${character.pvp_combat_rating}${ZWSP}`,
        inline: true,
      },
      { name: ':male_sign: Gender', value: `${character.gender}${ZWSP}`, inline: true },
      {
        name: ':busts_in_silhouette: League',
        value: `${character.guild?.name ?? '-'}${ZWSP}`,
        inline: true,
      },
      { name: ':dna: Power', value: `${character.power_type}${ZWSP}`, inline: true },
      { name: ':supervillain: Alignment', value: `${character.alignment}${ZWSP}`, inline: true },
      {
        name: ':performing_arts: Personality',
        value: `${character.personality}${ZWSP}`,
        inline: true,
      },
      { name: ':man_running: Movement', value: `${character.movement_mode}${ZWSP}`, inline: true },
      ...artifactFields,
      { name: ZWSP, value: ZWSP, inline: true },
      {
        name: ':superhero: Combat Ally',
        value: getAllyName(character.allies, (ally) => ally.combat),
        inline: true,
      },
      {
        name: ':superhero: Support Ally One',
        value: getAllyName(character.allies, (ally) => !ally.combat, 0),
        inline: true,
      },
      {
        name: ':superhero: Support Ally Two',
        value: getAllyName(character.allies, (ally) => !ally.combat, 1),
        inline: true,
      },
    );
};

export const buildStatisticsEmbed = (character: Character): EmbedBuilder => {
  return buildEmbed()
    .setTitle(`:bar_chart: Stats of ${character.name}`)
    .setURL(buildCharacterUrl(character))
    .setDescription(
      `Server: ${getServerByWorldId(+character.world_id)} • ` + `Power: ${character.power_type}`,
    )
    .setThumbnail(character.image.url)
    .addFields(
      {
        name: ':heart: Health',
        value: ZWSP + character.stats.health.toLocaleString(),
        inline: true,
      },
      {
        name: ':zap: Power',
        value: ZWSP + character.stats.power.toLocaleString(),
        inline: true,
      },
      {
        name: ':shield: Defense',
        value: ZWSP + character.stats.defense.toLocaleString(),
        inline: true,
      },
      {
        name: ':muscle: Toughness',
        value: ZWSP + character.stats.toughness.toLocaleString(),
        inline: true,
      },
      {
        name: ':magic_wand: Might',
        value: ZWSP + character.stats.might.toLocaleString(),
        inline: true,
      },
      {
        name: ':dart: Precision',
        value: ZWSP + character.stats.precision.toLocaleString(),
        inline: true,
      },
      {
        name: ':herb: Restoration',
        value: ZWSP + character.stats.restoration.toLocaleString(),
        inline: true,
      },
      {
        name: ':pill: Vitalization',
        value: ZWSP + character.stats.vitalization.toLocaleString(),
        inline: true,
      },
      {
        name: ':chains: Dominance',
        value: ZWSP + character.stats.dominance.toLocaleString(),
        inline: true,
      },
    );
};
