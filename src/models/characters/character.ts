import type { Ally } from './ally';
import type { Artifact } from './artifact';
import type { CharacterGuild } from './character-guild';
import type { CharacterImage } from './character-image';
import type { CharacterStats } from './character-stats';

export interface Character {
  character_id: string;
  name: string;
  world_id: string;
  personality: string;
  alignment: string;
  gender: string;
  power_type: string;
  movement_mode: string;
  skill_points: number;
  combat_rating: number;
  pvp_combat_rating: number;
  allies: Ally[];
  artifacts: Artifact[];
  guild: CharacterGuild;
  image: CharacterImage;
  stats: CharacterStats;
}
