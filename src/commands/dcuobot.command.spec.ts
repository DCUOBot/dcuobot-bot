import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Collection, type ChatInputCommandInteraction, type EmbedBuilder } from 'discord.js';
import command from './dcuobot.command';
import { buildCommandsEmbed } from '../helpers/commands-embed-helpers';
import type { Command } from '../types/command';

vi.mock('../helpers/commands-embed-helpers', () => ({
  buildCommandsEmbed: vi.fn(),
}));

const mockEmbed = { sentinel: 'embed' } as unknown as EmbedBuilder;

const mockCommands = new Collection<string, Command>([
  ['info', { data: { name: 'info' } } as unknown as Command],
  ['servers', { data: { name: 'servers' } } as unknown as Command],
]);

const createInteraction = (): ChatInputCommandInteraction =>
  ({
    client: { commands: mockCommands },
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
  }) as unknown as ChatInputCommandInteraction;

describe('dcuobot command', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(buildCommandsEmbed).mockReturnValue(mockEmbed);
  });

  it('is named "dcuobot" and requires no options', () => {
    const json = command.data.toJSON();

    expect(json.name).toBe('dcuobot');
    expect(json.options ?? []).toHaveLength(0);
  });

  it('defers, builds an embed from the loaded commands, and replies with it', async () => {
    const interaction = createInteraction();

    await command.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalledOnce();
    expect(buildCommandsEmbed).toHaveBeenCalledWith([...mockCommands.values()]);
    expect(interaction.editReply).toHaveBeenCalledWith({ embeds: [mockEmbed] });
  });
});
