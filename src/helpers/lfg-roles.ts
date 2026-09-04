import { config } from '../lib/config';

export type LfgRoleKey = 'tank' | 'healer' | 'controller' | 'dps';

export interface LfgRoleDefinition {
  key: LfgRoleKey;
  label: string;
  pluralLabel: string;
  emoji: string;
  optionName: string;
}

export const LFG_ROLES: LfgRoleDefinition[] = [
  {
    key: 'tank',
    label: 'Tank',
    pluralLabel: 'tanks',
    emoji: config.discord.emojis.tank,
    optionName: 'amount_of_tanks',
  },
  {
    key: 'healer',
    label: 'Healer',
    pluralLabel: 'healers',
    emoji: config.discord.emojis.healer,
    optionName: 'amount_of_healers',
  },
  {
    key: 'controller',
    label: 'Controller',
    pluralLabel: 'controllers',
    emoji: config.discord.emojis.controller,
    optionName: 'amount_of_controllers',
  },
  {
    key: 'dps',
    label: 'DPS',
    pluralLabel: 'DPS',
    emoji: config.discord.emojis.dps,
    optionName: 'amount_of_dps',
  },
];
