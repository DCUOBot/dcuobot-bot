import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import command from './top-leagues.command';
import { apiClient, ApiError } from '../lib/api-client';
import { buildTopLeaguesEmbed } from '../helpers/ranking/top-leagues-embed-helpers';
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
    apiClient: { getGuildsRanking: vi.fn() },
    ApiError,
  };
});

vi.mock('../helpers/ranking/top-leagues-embed-helpers', () => ({
  buildTopLeaguesEmbed: vi.fn(),
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
  member_count: 12,
  characters: [],
  ...overrides,
});

const createInteraction = (options: {
  server: string;
  sortby: string;
}): ChatInputCommandInteraction => {
  const getString = vi.fn((optionName: string) => {
    if (optionName === 'server') return options.server;
    if (optionName === 'sortby') return options.sortby;

    throw new Error(`Unexpected option requested: ${optionName}`);
  });

  return {
    options: { getString },
    client: { sentinel: 'client' },
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
  } as unknown as ChatInputCommandInteraction;
};

describe('top-leagues command', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(buildTopLeaguesEmbed).mockReturnValue(mockEmbed);
  });

  it('is named "topleagues" and requires a "server" and "sortby" option', () => {
    const json = command.data.toJSON();

    expect(json.name).toBe('topleagues');

    const optionNames = json.options?.map((option) => option.name);
    expect(optionNames).toEqual(['server', 'sortby']);
    expect(json.options?.every((option) => option.required)).toBe(true);
  });

  it('defers, looks up the ranking, and replies with the embed', async () => {
    const guilds = [buildGuild({ name: 'Justice League' })];
    vi.mocked(apiClient.getGuildsRanking).mockResolvedValue(guilds);

    const interaction = createInteraction({ server: 'us', sortby: 'avgcr' });

    await command.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalledOnce();
    expect(apiClient.getGuildsRanking).toHaveBeenCalledWith(2, 'averageCombatRating');
    expect(buildTopLeaguesEmbed).toHaveBeenCalledWith(guilds, 2, 'avgcr');
    expect(interaction.editReply).toHaveBeenCalledWith({ embeds: [mockEmbed] });
  });

  it('resolves the server option to the matching world ID, including "all"', async () => {
    vi.mocked(apiClient.getGuildsRanking).mockResolvedValue([]);

    const interaction = createInteraction({ server: 'All', sortby: 'members' });

    await command.execute(interaction);

    expect(apiClient.getGuildsRanking).toHaveBeenCalledWith(0, 'memberCount');
    expect(buildTopLeaguesEmbed).toHaveBeenCalledWith([], 0, 'members');
  });

  it('replies with the error message when the API client throws an ApiError, without rethrowing', async () => {
    vi.mocked(apiClient.getGuildsRanking).mockRejectedValue(
      new ApiError('Ranking unavailable.', 500),
    );

    const interaction = createInteraction({ server: 'us', sortby: 'avgcr' });

    await expect(command.execute(interaction)).resolves.toBeUndefined();
    expect(interaction.editReply).toHaveBeenCalledWith('Ranking unavailable.');
    expect(buildTopLeaguesEmbed).not.toHaveBeenCalled();
  });

  it('rethrows unexpected errors instead of swallowing them', async () => {
    vi.mocked(apiClient.getGuildsRanking).mockRejectedValue(new Error('network exploded'));

    const interaction = createInteraction({ server: 'us', sortby: 'avgcr' });

    await expect(command.execute(interaction)).rejects.toThrow('network exploded');
  });

  it('rejects with an error and skips the API call when the server is unknown', async () => {
    const interaction = createInteraction({ server: 'mars', sortby: 'avgcr' });

    await expect(command.execute(interaction)).rejects.toThrow('Invalid server.');
    expect(apiClient.getGuildsRanking).not.toHaveBeenCalled();
    expect(interaction.deferReply).toHaveBeenCalledOnce();
  });
});
