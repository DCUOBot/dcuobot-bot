import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder } from 'discord.js';
import command from './lfg.command';
import { buildLfgActionRow, buildLfgEmbed } from '../helpers/lfg-embed-helpers';

const EMOJIS = vi.hoisted(() => ({
  tank: '<:r_:1088024461778890772>',
  healer: '<:r_:1088024463070744698>',
  controller: '<:r_:1088024465008500788>',
  dps: '<:r_:1088024466291949599>',
}));

vi.mock('../lib/config', () => ({
  config: {
    discord: {
      emojis: EMOJIS,
    },
  },
}));

vi.mock('../helpers/lfg-embed-helpers', () => ({
  buildLfgEmbed: vi.fn(),
  buildLfgActionRow: vi.fn(),
}));

const mockEmbed = { sentinel: 'embed' } as unknown as EmbedBuilder;
const mockRow = { sentinel: 'row' } as unknown as ActionRowBuilder;

const createInteraction = (options: {
  instanceName: string;
  tanks: number;
  healers: number;
  controllers: number;
  dps: number;
}): ChatInputCommandInteraction => {
  const getString = vi.fn((name: string) => {
    if (name === 'instance_name') return options.instanceName;

    throw new Error(`Unexpected string option requested: ${name}`);
  });

  const getInteger = vi.fn((name: string) => {
    switch (name) {
      case 'amount_of_tanks':
        return options.tanks;
      case 'amount_of_healers':
        return options.healers;
      case 'amount_of_controllers':
        return options.controllers;
      case 'amount_of_dps':
        return options.dps;
      default:
        throw new Error(`Unexpected integer option requested: ${name}`);
    }
  });

  return {
    id: 'interaction-1',
    user: { username: 'Batman' },
    options: { getString, getInteger },
    reply: vi.fn().mockResolvedValue(undefined),
  } as unknown as ChatInputCommandInteraction;
};

const expectedRoles = (
  overrides: Partial<Record<'tanks' | 'healers' | 'controllers' | 'dps', number>>,
) => [
  { key: 'tank', label: 'Tank', pluralLabel: 'tanks', emoji: EMOJIS.tank, amount: overrides.tanks },
  {
    key: 'healer',
    label: 'Healer',
    pluralLabel: 'healers',
    emoji: EMOJIS.healer,
    amount: overrides.healers,
  },
  {
    key: 'controller',
    label: 'Controller',
    pluralLabel: 'controllers',
    emoji: EMOJIS.controller,
    amount: overrides.controllers,
  },
  { key: 'dps', label: 'DPS', pluralLabel: 'DPS', emoji: EMOJIS.dps, amount: overrides.dps },
];

describe('lfg command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(buildLfgEmbed).mockReturnValue(mockEmbed);
    vi.mocked(buildLfgActionRow).mockReturnValue(mockRow as ActionRowBuilder<never>);
  });

  it('is named "lfg" and requires an instance name and four role amounts', () => {
    const json = command.data.toJSON();

    expect(json.name).toBe('lfg');

    const optionNames = json.options?.map((option) => option.name);
    expect(optionNames).toEqual([
      'instance_name',
      'amount_of_tanks',
      'amount_of_healers',
      'amount_of_controllers',
      'amount_of_dps',
    ]);
    expect(json.options?.every((option) => option.required)).toBe(true);
  });

  it('replies with the embed and action row built from the requested roles', async () => {
    const interaction = createInteraction({
      instanceName: 'Throne of the Dead King',
      tanks: 1,
      healers: 1,
      controllers: 1,
      dps: 1,
    });

    await command.execute(interaction);

    const roles = expectedRoles({ tanks: 1, healers: 1, controllers: 1, dps: 1 });

    expect(buildLfgEmbed).toHaveBeenCalledWith('Throne of the Dead King', 'Batman', roles);
    expect(buildLfgActionRow).toHaveBeenCalledWith('interaction-1', roles);
    expect(interaction.reply).toHaveBeenCalledWith({
      embeds: [mockEmbed],
      components: [mockRow],
    });
  });

  it.each([
    ['amount_of_tanks negative', { tanks: -1, healers: 1, controllers: 1, dps: 1 }, 'tanks'],
    ['amount_of_healers negative', { tanks: 1, healers: -1, controllers: 1, dps: 1 }, 'healers'],
    [
      'amount_of_controllers negative',
      { tanks: 1, healers: 1, controllers: -1, dps: 1 },
      'controllers',
    ],
    ['amount_of_dps negative', { tanks: 1, healers: 1, controllers: 1, dps: -1 }, 'DPS'],
  ])('rejects when %s, without building an embed', async (_case, amounts, pluralLabel) => {
    const interaction = createInteraction({ instanceName: 'Instance', ...amounts });

    await command.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      `Amount of ${pluralLabel} cannot be less than 0.`,
    );
    expect(buildLfgEmbed).not.toHaveBeenCalled();
  });

  it('reports the first invalid role in role order when multiple are negative', async () => {
    const interaction = createInteraction({
      instanceName: 'Instance',
      tanks: -1,
      healers: 1,
      controllers: 1,
      dps: -1,
    });

    await command.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith('Amount of tanks cannot be less than 0.');
  });

  it.each([
    ['below the minimum', { tanks: 1, healers: 1, controllers: 1, dps: 0 }],
    ['above the maximum', { tanks: 3, healers: 3, controllers: 2, dps: 1 }],
  ])('rejects a group size %s, without building an embed', async (_case, amounts) => {
    const interaction = createInteraction({ instanceName: 'Instance', ...amounts });

    await command.execute(interaction);

    expect(interaction.reply).toHaveBeenCalledWith('The group size must be between 4 and 8.');
    expect(buildLfgEmbed).not.toHaveBeenCalled();
  });

  it('accepts a group size at the minimum boundary (4)', async () => {
    const interaction = createInteraction({
      instanceName: 'Instance',
      tanks: 1,
      healers: 1,
      controllers: 1,
      dps: 1,
    });

    await command.execute(interaction);

    expect(buildLfgEmbed).toHaveBeenCalledOnce();
  });

  it('accepts a group size at the maximum boundary (8)', async () => {
    const interaction = createInteraction({
      instanceName: 'Instance',
      tanks: 2,
      healers: 2,
      controllers: 2,
      dps: 2,
    });

    await command.execute(interaction);

    expect(buildLfgEmbed).toHaveBeenCalledOnce();
  });

  it('propagates errors instead of catching them locally (there is no ApiError source)', async () => {
    vi.mocked(buildLfgEmbed).mockImplementation(() => {
      throw new Error('boom');
    });

    const interaction = createInteraction({
      instanceName: 'Instance',
      tanks: 1,
      healers: 1,
      controllers: 1,
      dps: 1,
    });

    await expect(command.execute(interaction)).rejects.toThrow('boom');
  });
});
