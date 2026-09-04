import type { EmbedBuilder } from 'discord.js';
import type { Guild } from '../../models/guilds/guild';
import { buildEmbed } from '../embed-helpers';
import { config } from '../../lib/config';
import { getServerByWorldId } from '../world-id-helpers';

const ZWSP = '​';
const MAX_DISPLAYED_MEMBERS = 10;

export const buildGuildImageUrl = (): string => {
  const url = new URL('/assets/images/genders/mixed.jpeg', config.frontendUrl);
  return url.toString();
};

export const buildGuildUrl = (guild: Guild): string => {
  const url = new URL('/leagues', config.frontendUrl);
  url.searchParams.set('query', guild.name);
  url.searchParams.set('worldId', guild.world_id);

  return url.toString();
};

export const buildGuildEmbed = (guild: Guild): EmbedBuilder => {
  const memberFields = guild.characters.slice(0, MAX_DISPLAYED_MEMBERS).map((member) => ({
    name: `:bust_in_silhouette: ${member.name}`,
    value:
      `Rank: **${member.rank === 0 ? '1 (Leader)' : member.rank + 1}**` +
      ` • SP: **${member.skill_points}**` +
      ` • CR: **${member.combat_rating}**` +
      ` • PvP CR: **${member.pvp_combat_rating}**`,
    inline: false,
  }));

  const embed = buildEmbed()
    .setTitle(`:busts_in_silhouette: ${guild.name}`)
    .setURL(buildGuildUrl(guild))
    .setDescription(
      `Server: ${getServerByWorldId(+guild.world_id)} • Members: ${guild.characters.length} • ` +
        `Alignment: ${guild.alignment}`,
    )
    .setThumbnail(buildGuildImageUrl())
    .addFields(
      {
        name: ':chart_with_upwards_trend: Avg. Skill Points',
        value: `${guild.average_skill_points}`,
        inline: true,
      },
      {
        name: ':dagger: Avg. Combat Rating',
        value: `${guild.average_combat_rating}`,
        inline: true,
      },
      {
        name: ':crossed_swords: Avg. PvP Combat Rating',
        value: `${guild.average_pvp_combat_rating}`,
        inline: true,
      },
      {
        name: ZWSP,
        value: ZWSP,
        inline: false,
      },
      {
        name: '**League Members:**',
        value: ZWSP,
        inline: false,
      },
      ...memberFields,
    );

  const remainingMembers = guild.characters.length - MAX_DISPLAYED_MEMBERS;

  if (remainingMembers > 0) {
    embed.addFields({
      name: ZWSP,
      value: `... and **${remainingMembers}** more`,
      inline: false,
    });
  }

  return embed;
};
