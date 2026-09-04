import { AxiosError, type AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient, ApiError, apiClient } from './api-client';

const { mockRequest, mockCreate } = vi.hoisted(() => {
  const mockRequest = vi.fn();
  const mockCreate = vi.fn(() => ({ request: mockRequest }));

  return { mockRequest, mockCreate };
});

vi.mock('axios', async (importOriginal) => {
  const actual = await importOriginal<typeof import('axios')>();

  return {
    ...actual,
    default: {
      ...actual.default,
      create: mockCreate,
    },
  };
});

vi.mock('./config', () => ({
  config: {
    api: {
      baseUrl: 'https://mocked.example/api',
    },
  },
}));

const singletonCreateCall = mockCreate.mock.calls.at(-1);

const buildAxiosError = (response?: Partial<AxiosResponse>): AxiosError =>
  new AxiosError(
    'Request failed',
    'ERR_BAD_REQUEST',
    undefined,
    undefined,
    response as AxiosResponse | undefined,
  );

describe('ApiClient', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockRequest.mockReset();
  });

  describe('constructor', () => {
    it('defaults to the base URL from config', () => {
      new ApiClient();

      expect(mockCreate).toHaveBeenCalledWith({ baseURL: 'https://mocked.example/api' });
    });

    it('uses a custom base URL when provided', () => {
      new ApiClient('https://custom.example/api');

      expect(mockCreate).toHaveBeenCalledWith({ baseURL: 'https://custom.example/api' });
    });
  });

  describe('getCharacter', () => {
    it('requests /characters with the name and worldId as params, and returns the response data', async () => {
      const character = { character_id: '1', name: 'Batman' };
      mockRequest.mockResolvedValue({ data: character });

      const client = new ApiClient('https://mocked.example/api');
      const result = await client.getCharacter('Batman', 2);

      expect(mockRequest).toHaveBeenCalledWith({
        url: '/characters',
        params: { name: 'Batman', worldId: 2 },
      });
      expect(result).toBe(character);
    });

    it('wraps an AxiosError with a response into an ApiError using the response status and message', async () => {
      mockRequest.mockRejectedValue(
        buildAxiosError({
          status: 404,
          data: { message: 'Character not found.' },
        } as AxiosResponse),
      );

      const client = new ApiClient('https://mocked.example/api');

      await expect(client.getCharacter('Batman', 2)).rejects.toMatchObject({
        name: 'ApiError',
        message: 'Character not found.',
        status: 404,
      });
    });

    it('falls back to a generic message when the error response has no body', async () => {
      mockRequest.mockRejectedValue(buildAxiosError({ status: 500 } as AxiosResponse));

      const client = new ApiClient('https://mocked.example/api');

      await expect(client.getCharacter('Batman', 2)).rejects.toMatchObject({
        name: 'ApiError',
        message: 'An error occurred, please try again later.',
        status: 500,
      });
    });

    it('falls back to a generic message and status 0 when the AxiosError has no response at all', async () => {
      mockRequest.mockRejectedValue(buildAxiosError(undefined));

      const client = new ApiClient('https://mocked.example/api');

      await expect(client.getCharacter('Batman', 2)).rejects.toMatchObject({
        name: 'ApiError',
        message: 'An error occurred, please try again later.',
        status: 0,
      });
    });

    it('rethrows non-Axios errors unchanged', async () => {
      mockRequest.mockRejectedValue(new Error('unexpected failure'));

      const client = new ApiClient('https://mocked.example/api');

      await expect(client.getCharacter('Batman', 2)).rejects.toThrow('unexpected failure');
      await expect(client.getCharacter('Batman', 2)).rejects.not.toBeInstanceOf(ApiError);
    });
  });

  describe('getGuild', () => {
    it('requests /guilds with the name and worldId as params, and returns the response data', async () => {
      const guild = { guild_id: '1', name: 'Justice League' };
      mockRequest.mockResolvedValue({ data: guild });

      const client = new ApiClient('https://mocked.example/api');
      const result = await client.getGuild('Justice League', 2);

      expect(mockRequest).toHaveBeenCalledWith({
        url: '/guilds',
        params: { name: 'Justice League', worldId: 2 },
      });
      expect(result).toBe(guild);
    });

    it('wraps an AxiosError with a response into an ApiError using the response status and message', async () => {
      mockRequest.mockRejectedValue(
        buildAxiosError({
          status: 404,
          data: { message: 'League not found.' },
        } as AxiosResponse),
      );

      const client = new ApiClient('https://mocked.example/api');

      await expect(client.getGuild('Justice League', 2)).rejects.toMatchObject({
        name: 'ApiError',
        message: 'League not found.',
        status: 404,
      });
    });

    it('falls back to a generic message when the error response has no body', async () => {
      mockRequest.mockRejectedValue(buildAxiosError({ status: 500 } as AxiosResponse));

      const client = new ApiClient('https://mocked.example/api');

      await expect(client.getGuild('Justice League', 2)).rejects.toMatchObject({
        name: 'ApiError',
        message: 'An error occurred, please try again later.',
        status: 500,
      });
    });

    it('falls back to a generic message and status 0 when the AxiosError has no response at all', async () => {
      mockRequest.mockRejectedValue(buildAxiosError(undefined));

      const client = new ApiClient('https://mocked.example/api');

      await expect(client.getGuild('Justice League', 2)).rejects.toMatchObject({
        name: 'ApiError',
        message: 'An error occurred, please try again later.',
        status: 0,
      });
    });

    it('rethrows non-Axios errors unchanged', async () => {
      mockRequest.mockRejectedValue(new Error('unexpected failure'));

      const client = new ApiClient('https://mocked.example/api');

      await expect(client.getGuild('Justice League', 2)).rejects.toThrow('unexpected failure');
      await expect(client.getGuild('Justice League', 2)).rejects.not.toBeInstanceOf(ApiError);
    });
  });

  describe('getCharactersRanking', () => {
    it('requests /characters with the worldId and sort as params, and returns the response data', async () => {
      const characters = [{ character_id: '1', name: 'Batman' }];
      mockRequest.mockResolvedValue({ data: characters });

      const client = new ApiClient('https://mocked.example/api');
      const result = await client.getCharactersRanking(2, 'skill_points');

      expect(mockRequest).toHaveBeenCalledWith({
        url: '/characters',
        params: { worldId: 2, sort: 'skill_points' },
      });
      expect(result).toBe(characters);
    });

    it('wraps an AxiosError with a response into an ApiError using the response status and message', async () => {
      mockRequest.mockRejectedValue(
        buildAxiosError({
          status: 500,
          data: { message: 'Ranking unavailable.' },
        } as AxiosResponse),
      );

      const client = new ApiClient('https://mocked.example/api');

      await expect(client.getCharactersRanking(2, 'skill_points')).rejects.toMatchObject({
        name: 'ApiError',
        message: 'Ranking unavailable.',
        status: 500,
      });
    });

    it('falls back to a generic message when the error response has no body', async () => {
      mockRequest.mockRejectedValue(buildAxiosError({ status: 500 } as AxiosResponse));

      const client = new ApiClient('https://mocked.example/api');

      await expect(client.getCharactersRanking(2, 'skill_points')).rejects.toMatchObject({
        name: 'ApiError',
        message: 'An error occurred, please try again later.',
        status: 500,
      });
    });

    it('falls back to a generic message and status 0 when the AxiosError has no response at all', async () => {
      mockRequest.mockRejectedValue(buildAxiosError(undefined));

      const client = new ApiClient('https://mocked.example/api');

      await expect(client.getCharactersRanking(2, 'skill_points')).rejects.toMatchObject({
        name: 'ApiError',
        message: 'An error occurred, please try again later.',
        status: 0,
      });
    });

    it('rethrows non-Axios errors unchanged', async () => {
      mockRequest.mockRejectedValue(new Error('unexpected failure'));

      const client = new ApiClient('https://mocked.example/api');

      await expect(client.getCharactersRanking(2, 'skill_points')).rejects.toThrow(
        'unexpected failure',
      );
      await expect(client.getCharactersRanking(2, 'skill_points')).rejects.not.toBeInstanceOf(
        ApiError,
      );
    });
  });
});

describe('apiClient', () => {
  it('is a singleton ApiClient built with the configured base URL', () => {
    expect(apiClient).toBeInstanceOf(ApiClient);
    expect(singletonCreateCall).toEqual([{ baseURL: 'https://mocked.example/api' }]);
  });
});
