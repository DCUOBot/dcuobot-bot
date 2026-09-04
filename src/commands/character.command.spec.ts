import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import command from './character.command';
import { apiClient, ApiError } from '../lib/api-client';
import { buildCharacterEmbed } from '../helpers/character/character-embed-helpers';
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
    apiClient: { getCharacter: vi.fn() },
    ApiError,
  };
});

vi.mock('../helpers/character/character-embed-helpers', () => ({
  buildCharacterEmbed: vi.fn(),
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

describe('character command', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(buildCharacterEmbed).mockReturnValue(mockEmbed);
  });

  it('is named "character" and requires a "name" and "server" option', () => {
    const json = command.data.toJSON();

    expect(json.name).toBe('character');

    const optionNames = json.options?.map((option) => option.name);
    expect(optionNames).toEqual(['name', 'server']);
    expect(json.options?.every((option) => option.required)).toBe(true);
  });

  it('defers, looks up the character, and replies with the embed on an exact match', async () => {
    const character = buildCharacter({ name: 'Batman' });
    vi.mocked(apiClient.getCharacter).mockResolvedValue(character);

    const interaction = createInteraction({ name: 'Batman', server: 'us' });

    await command.execute(interaction);

    expect(interaction.deferReply).toHaveBeenCalledOnce();
    expect(apiClient.getCharacter).toHaveBeenCalledWith('Batman', 2);
    expect(buildCharacterEmbed).toHaveBeenCalledWith(interaction.client, character);
    expect(interaction.editReply).toHaveBeenCalledWith({ content: null, embeds: [mockEmbed] });
  });

  it('resolves the server option to the matching world ID', async () => {
    const character = buildCharacter({ name: 'Batman', world_id: '4' });
    vi.mocked(apiClient.getCharacter).mockResolvedValue(character);

    const interaction = createInteraction({ name: 'Batman', server: 'EU' });

    await command.execute(interaction);

    expect(apiClient.getCharacter).toHaveBeenCalledWith('Batman', 4);
  });

  it('adds a "did you mean" notice when the returned character name is not an exact match', async () => {
    const character = buildCharacter({ name: 'Batman (Inactive)' });
    vi.mocked(apiClient.getCharacter).mockResolvedValue(character);

    const interaction = createInteraction({ name: '  batman  ', server: 'us' });

    await command.execute(interaction);

    expect(interaction.editReply).toHaveBeenCalledWith({
      content: expect.stringContaining('batman'),
      embeds: [mockEmbed],
    });
  });

  it('treats matches as exact regardless of casing or surrounding whitespace', async () => {
    const character = buildCharacter({ name: 'Batman' });
    vi.mocked(apiClient.getCharacter).mockResolvedValue(character);

    const interaction = createInteraction({ name: '  BATMAN  ', server: 'us' });

    await command.execute(interaction);

    expect(interaction.editReply).toHaveBeenCalledWith({ content: null, embeds: [mockEmbed] });
  });

  it('replies with the error message when the API client throws an ApiError, without rethrowing', async () => {
    vi.mocked(apiClient.getCharacter).mockRejectedValue(new ApiError('Character not found.', 404));

    const interaction = createInteraction({ name: 'Batman', server: 'us' });

    await expect(command.execute(interaction)).resolves.toBeUndefined();
    expect(interaction.editReply).toHaveBeenCalledWith('Character not found.');
    expect(buildCharacterEmbed).not.toHaveBeenCalled();
  });

  it('rethrows unexpected errors instead of swallowing them', async () => {
    vi.mocked(apiClient.getCharacter).mockRejectedValue(new Error('network exploded'));

    const interaction = createInteraction({ name: 'Batman', server: 'us' });

    await expect(command.execute(interaction)).rejects.toThrow('network exploded');
  });

  it('rejects with an error and skips the API call when the server is unknown', async () => {
    const interaction = createInteraction({ name: 'Batman', server: 'mars' });

    await expect(command.execute(interaction)).rejects.toThrow('Invalid server.');
    expect(apiClient.getCharacter).not.toHaveBeenCalled();
    expect(interaction.deferReply).toHaveBeenCalledOnce();
  });
});
