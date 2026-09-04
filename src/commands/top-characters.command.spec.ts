import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import command from './top-characters.command';
import { apiClient, ApiError } from '../lib/api-client';
import { buildTopCharactersEmbed } from '../helpers/top-characters-embed-helpers';
import type { Character } from '../models/characters/character';

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
    apiClient: { getCharactersRanking: vi.fn() },
    ApiError,
  };
});

vi.mock('../helpers/top-characters-embed-helpers', () => ({
  buildTopCharactersEmbed: vi.fn(),
}));

const mockEmbed = { sentinel: 'embed' } as unknown as EmbedBuilder;

const buildCharacter = (overrides: Partial<Character> = {}): Character => ({
  character_id: '1',
  name: 'Batman',
  world_id: '2',
  personality: 'Brooding',
  alignment: 'Hero',
  gender: 'Male',
  power_type: 'Gadgets',
  movement_mode: 'Acrobatics',
  skill_points: 250,
  combat_rating: 400,
  pvp_combat_rating: 380,
  allies: [],
  artifacts: [],
  guild: { id: '1', name: 'Justice League' },
  image: { url: 'https://example.com/batman.png', alt_url: 'https://example.com/batman-alt.png' },
  stats: {
    health: 1,
    power: 1,
    might: 1,
    precision: 1,
    defense: 1,
    dominance: 1,
    toughness: 1,
    restoration: 1,
    vitalization: 1,
  },
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

describe('top-characters command', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(buildTopCharactersEmbed).mockReturnValue(mockEmbed);
  });

  it('is named "topcharacters" and requires a "server" and "sortby" option', () => {
    const json = command.data.toJSON();

    expect(json.name).toBe('topcharacters');

    const optionNames = json.options?.map((option) => option.name);
    expect(optionNames).toEqual(['server', 'sortby']);
    expect(json.options?.every((option) => option.required)).toBe(true);
  });

  it('defers, looks up the ranking, and replies with the embed', async () => {
    const characters = [buildCharacter({ name: 'Batman' })];
    vi.mocked(apiClient.getCharactersRanking).mockResolvedValue(characters);

    const interaction = createInteraction({ server: 'us', sortby: 'sp' });

    await command.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalledOnce();
    expect(apiClient.getCharactersRanking).toHaveBeenCalledWith(2, 'skill_points');
    expect(buildTopCharactersEmbed).toHaveBeenCalledWith(characters, 2, 'sp');
    expect(interaction.editReply).toHaveBeenCalledWith({ embeds: [mockEmbed] });
  });

  it('resolves the server option to the matching world ID, including "all"', async () => {
    vi.mocked(apiClient.getCharactersRanking).mockResolvedValue([]);

    const interaction = createInteraction({ server: 'All', sortby: 'cr' });

    await command.execute(interaction);

    expect(apiClient.getCharactersRanking).toHaveBeenCalledWith(0, 'combat_rating');
    expect(buildTopCharactersEmbed).toHaveBeenCalledWith([], 0, 'cr');
  });

  it('replies with the error message when the API client throws an ApiError, without rethrowing', async () => {
    vi.mocked(apiClient.getCharactersRanking).mockRejectedValue(
      new ApiError('Ranking unavailable.', 500),
    );

    const interaction = createInteraction({ server: 'us', sortby: 'sp' });

    await expect(command.execute(interaction)).resolves.toBeUndefined();
    expect(interaction.editReply).toHaveBeenCalledWith('Ranking unavailable.');
    expect(buildTopCharactersEmbed).not.toHaveBeenCalled();
  });

  it('rethrows unexpected errors instead of swallowing them', async () => {
    vi.mocked(apiClient.getCharactersRanking).mockRejectedValue(new Error('network exploded'));

    const interaction = createInteraction({ server: 'us', sortby: 'sp' });

    await expect(command.execute(interaction)).rejects.toThrow('network exploded');
  });

  it('rejects with an error and skips the API call when the server is unknown', async () => {
    const interaction = createInteraction({ server: 'mars', sortby: 'sp' });

    await expect(command.execute(interaction)).rejects.toThrow('Invalid server.');
    expect(apiClient.getCharactersRanking).not.toHaveBeenCalled();
    expect(interaction.deferReply).toHaveBeenCalledOnce();
  });
});
