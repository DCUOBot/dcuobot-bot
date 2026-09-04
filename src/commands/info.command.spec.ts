import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import command from './info.command';
import { getSystemInfo } from '../helpers/system-info-helpers';
import { buildInfoEmbed } from '../helpers/info-embed-helpers';
import type { SystemInfo } from '../helpers/system-info-helpers';

vi.mock('../helpers/system-info-helpers', () => ({
  getSystemInfo: vi.fn(),
}));

vi.mock('../helpers/info-embed-helpers', () => ({
  buildInfoEmbed: vi.fn(),
}));

const mockEmbed = { sentinel: 'embed' } as unknown as EmbedBuilder;

const mockSystemInfo: SystemInfo = { discordPingMs: 42, uptimeMs: 123456 };

const createInteraction = (): ChatInputCommandInteraction =>
  ({
    options: { getString: vi.fn() },
    client: { sentinel: 'client' },
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
  }) as unknown as ChatInputCommandInteraction;

describe('info command', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getSystemInfo).mockReturnValue(mockSystemInfo);
    vi.mocked(buildInfoEmbed).mockReturnValue(mockEmbed);
  });

  it('is named "info" and requires no options', () => {
    const json = command.data.toJSON();

    expect(json.name).toBe('info');
    expect(json.options ?? []).toHaveLength(0);
  });

  it('defers, gathers system info, and replies with the embed', async () => {
    const interaction = createInteraction();

    await command.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalledOnce();
    expect(getSystemInfo).toHaveBeenCalledWith(interaction.client);
    expect(buildInfoEmbed).toHaveBeenCalledWith(mockSystemInfo);
    expect(interaction.editReply).toHaveBeenCalledWith({ embeds: [mockEmbed] });
  });

  it('propagates errors instead of catching them locally (there is no ApiError source)', async () => {
    vi.mocked(getSystemInfo).mockImplementation(() => {
      throw new Error('boom');
    });

    const interaction = createInteraction();

    await expect(command.execute(interaction)).rejects.toThrow('boom');
  });
});
