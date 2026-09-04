import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import command from './league.command';
import { apiClient, ApiError } from '../lib/api-client';
import { buildGuildEmbed } from '../helpers/guild-embed-helpers';
import type { Guild } from '../models/guilds/guild';

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
    apiClient: { getGuild: vi.fn() },
    ApiError,
  };
});

vi.mock('../helpers/guild-embed-helpers', () => ({
  buildGuildEmbed: vi.fn(),
}));

const mockEmbed = { sentinel: 'embed' } as unknown as EmbedBuilder;

const buildGuild = (overrides: Partial<Guild> = {}): Guild => ({
  guild_id: '1',
  name: 'Justice League',
  world_id: '2',
  alignment: 'Hero',
  average_skill_points: 250,
  average_combat_rating: 400,
  average_pvp_combat_rating: 380,
  member_count: 1,
  characters: [],
  ...overrides,
});

const createInteraction = (options: {
  name: string;
  server: string;
}): ChatInputCommandInteraction => {
  const getString = vi.fn((optionName: string) => {
    if (optionName === 'name') return options.name;
    if (optionName === 'server') return options.server;

    throw new Error(`Unexpected option requested: ${optionName}`);
  });

  return {
    options: { getString },
    client: { sentinel: 'client' },
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
  } as unknown as ChatInputCommandInteraction;
};

describe('league command', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(buildGuildEmbed).mockReturnValue(mockEmbed);
  });

  it('is named "league" and requires a "name" and "server" option', () => {
    const json = command.data.toJSON();

    expect(json.name).toBe('league');

    const optionNames = json.options?.map((option) => option.name);
    expect(optionNames).toEqual(['name', 'server']);
    expect(json.options?.every((option) => option.required)).toBe(true);
  });

  it('defers, looks up the league, and replies with the embed', async () => {
    const guild = buildGuild({ name: 'Justice League' });
    vi.mocked(apiClient.getGuild).mockResolvedValue(guild);

    const interaction = createInteraction({ name: 'Justice League', server: 'us' });

    await command.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalledOnce();
    expect(apiClient.getGuild).toHaveBeenCalledWith('Justice League', 2);
    expect(buildGuildEmbed).toHaveBeenCalledWith(guild);
    expect(interaction.editReply).toHaveBeenCalledWith({ embeds: [mockEmbed] });
  });

  it('resolves the server option to the matching world ID', async () => {
    const guild = buildGuild({ world_id: '4' });
    vi.mocked(apiClient.getGuild).mockResolvedValue(guild);

    const interaction = createInteraction({ name: 'Justice League', server: 'EU' });

    await command.execute(interaction);

    expect(apiClient.getGuild).toHaveBeenCalledWith('Justice League', 4);
  });

  it('replies with the error message when the API client throws an ApiError, without rethrowing', async () => {
    vi.mocked(apiClient.getGuild).mockRejectedValue(new ApiError('League not found.', 404));

    const interaction = createInteraction({ name: 'Justice League', server: 'us' });

    await expect(command.execute(interaction)).resolves.toBeUndefined();
    expect(interaction.editReply).toHaveBeenCalledWith('League not found.');
    expect(buildGuildEmbed).not.toHaveBeenCalled();
  });

  it('rethrows unexpected errors instead of swallowing them', async () => {
    vi.mocked(apiClient.getGuild).mockRejectedValue(new Error('network exploded'));

    const interaction = createInteraction({ name: 'Justice League', server: 'us' });

    await expect(command.execute(interaction)).rejects.toThrow('network exploded');
  });

  it('rejects with an error and skips the API call when the server is unknown', async () => {
    const interaction = createInteraction({ name: 'Justice League', server: 'mars' });

    await expect(command.execute(interaction)).rejects.toThrow('Invalid server.');
    expect(apiClient.getGuild).not.toHaveBeenCalled();
    expect(interaction.deferReply).toHaveBeenCalledOnce();
  });
});
