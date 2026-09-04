import type { GuildCharacter } from './guild-character';

export interface Guild {
  guild_id: string;
  name: string;
  world_id: string;
  alignment: string;
  average_skill_points: number;
  average_combat_rating: number;
  average_pvp_combat_rating: number;
  member_count: number;
  characters: GuildCharacter[];
}
