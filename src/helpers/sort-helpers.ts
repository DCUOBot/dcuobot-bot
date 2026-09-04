import type { Character } from '../models/characters/character';
import type { Guild } from '../models/guilds/guild';

export const getApiSortByBotSort = (sort: string): string => {
  switch (sort.toLowerCase()) {
    case 'sp':
      return 'skill_points';
    case 'cr':
      return 'combat_rating';
    case 'pvpcr':
      return 'pvp_combat_rating';
    case 'health':
      return 'max_health';
    case 'power':
      return 'max_power';
    case 'avgsp':
      return 'averageSkillPoints';
    case 'avgcr':
      return 'averageCombatRating';
    case 'avgpvpcr':
      return 'averagePvpCombatRating';
    case 'members':
      return 'memberCount';
  }

  return sort.toLowerCase();
};

export const getSortEmoji = (sort: string): string => {
  switch (sort.toLowerCase()) {
    case 'sp':
    case 'avgsp':
      return ':chart_with_upwards_trend:';
    case 'cr':
    case 'avgcr':
      return ':dagger:';
    case 'avgpvpcr':
    case 'pvpcr':
      return ':crossed_swords:';
    case 'health':
      return ':heart:';
    case 'power':
      return ':zap:';
    case 'defense':
      return ':shield:';
    case 'toughness':
      return ':muscle:';
    case 'might':
      return ':magic_wand:';
    case 'precision':
      return ':dart:';
    case 'restoration':
      return ':herb:';
    case 'vitalization':
      return ':pill:';
    case 'dominance':
      return ':chains:';
    case 'members':
      return ':1234:';
  }

  throw new Error('Invalid sort.');
};

export const getSortLabel = (sort: string): string => {
  switch (sort.toLowerCase()) {
    case 'sp':
      return 'Skill Points';
    case 'cr':
      return 'Combat Rating';
    case 'pvpcr':
      return 'PvP Combat Rating';
    case 'health':
      return 'Health';
    case 'power':
      return 'Power';
    case 'defense':
      return 'Defense';
    case 'toughness':
      return 'Toughness';
    case 'might':
      return 'Might';
    case 'precision':
      return 'Precision';
    case 'restoration':
      return 'Restoration';
    case 'vitalization':
      return 'Vitalization';
    case 'dominance':
      return 'Dominance';
    case 'avgsp':
      return 'Avg. Skill Points';
    case 'avgcr':
      return 'Avg. Combat Rating';
    case 'avgpvpcr':
      return 'Avg. PvP Combat Rating';
    case 'members':
      return 'Members';
  }

  throw new Error('Invalid sort.');
};

export const getCharacterStatBySort = (sort: string, character: Character): number => {
  switch (sort.toLowerCase()) {
    case 'sp':
      return character.skill_points;
    case 'cr':
      return character.combat_rating;
    case 'pvpcr':
      return character.pvp_combat_rating;
    case 'health':
      return character.stats.health;
    case 'power':
      return character.stats.power;
    case 'defense':
      return character.stats.defense;
    case 'toughness':
      return character.stats.toughness;
    case 'might':
      return character.stats.might;
    case 'precision':
      return character.stats.precision;
    case 'restoration':
      return character.stats.restoration;
    case 'vitalization':
      return character.stats.vitalization;
    case 'dominance':
      return character.stats.dominance;
  }

  throw new Error('Invalid sort.');
};

export const getGuildStatBySort = (sort: string, guild: Guild): number => {
  switch (sort.toLowerCase()) {
    case 'avgsp':
      return guild.average_skill_points;
    case 'avgcr':
      return guild.average_combat_rating;
    case 'avgpvpcr':
      return guild.average_pvp_combat_rating;
    case 'members':
      return guild.member_count;
  }

  throw new Error('Invalid sort.');
};
