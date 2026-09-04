import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import command from './servers.command';
import { apiClient, ApiError } from '../lib/api-client';
import { buildServersEmbed } from '../helpers/servers-embed-helpers';
import type { GameServer } from '../models/game-servers/game-server';

vi.mock('../lib/api-client', () => {
  class ApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }

  return {
    apiClient: { getGameServerStatus: vi.fn() },
    ApiError,
  };
});

vi.mock('../helpers/servers-embed-helpers', () => ({
  buildServersEmbed: vi.fn(),
}));

const mockEmbed = { sentinel: 'embed' } as unknown as EmbedBuilder;

const buildGameServer = (overrides: Partial<GameServer> = {}): GameServer => ({
  server_name: 'US',
  status: 'Online',
  population: 'medium',
  ...overrides,
});

const createInteraction = (): ChatInputCommandInteraction =>
  ({
    options: { getString: vi.fn() },
    client: { sentinel: 'client' },
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
  }) as unknown as ChatInputCommandInteraction;

describe('servers command', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(buildServersEmbed).mockReturnValue(mockEmbed);
  });

  it('is named "servers" and requires no options', () => {
    const json = command.data.toJSON();

    expect(json.name).toBe('servers');
    expect(json.options ?? []).toHaveLength(0);
  });

  it('defers, fetches the game server status, and replies with the embed', async () => {
    const gameServers = [buildGameServer()];
    vi.mocked(apiClient.getGameServerStatus).mockResolvedValue(gameServers);

    const interaction = createInteraction();

    await command.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalledOnce();
    expect(apiClient.getGameServerStatus).toHaveBeenCalledOnce();
    expect(buildServersEmbed).toHaveBeenCalledWith(gameServers);
    expect(interaction.editReply).toHaveBeenCalledWith({ embeds: [mockEmbed] });
  });

  it('replies with the error message when the API client throws an ApiError, without rethrowing', async () => {
    vi.mocked(apiClient.getGameServerStatus).mockRejectedValue(
      new ApiError('Servers unavailable.', 500),
    );

    const interaction = createInteraction();

    await expect(command.execute(interaction)).resolves.toBeUndefined();
    expect(interaction.editReply).toHaveBeenCalledWith('Servers unavailable.');
    expect(buildServersEmbed).not.toHaveBeenCalled();
  });

  it('rethrows unexpected errors instead of swallowing them', async () => {
    vi.mocked(apiClient.getGameServerStatus).mockRejectedValue(new Error('network exploded'));

    const interaction = createInteraction();

    await expect(command.execute(interaction)).rejects.toThrow('network exploded');
  });
});
