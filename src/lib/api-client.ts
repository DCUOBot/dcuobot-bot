import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { config } from './config';
import type { Character } from '../models/characters/character';
import type { Guild } from '../models/guilds/guild';

interface ApiErrorResponseBody {
  message?: string;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export class ApiClient {
  private readonly http: AxiosInstance;

  constructor(baseUrl: string = config.api.baseUrl) {
    this.http = axios.create({ baseURL: baseUrl });
  }

  private async request<T>(path: string, requestConfig?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.http.request<T>({ url: path, ...requestConfig });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status ?? 0;
        const body = error.response?.data as ApiErrorResponseBody | undefined;
        throw new ApiError(body?.message ?? 'An error occurred, please try again later.', status);
      }

      throw error;
    }
  }

  async getCharacter(name: string, worldId: number): Promise<Character> {
    return this.request<Character>('/characters', {
      params: {
        name,
        worldId,
      },
    });
  }

  async getGuild(name: string, worldId: number): Promise<Guild> {
    return this.request<Guild>('/guilds', {
      params: {
        name,
        worldId,
      },
    });
  }

  async getCharactersRanking(worldId: number, sort: string): Promise<Character[]> {
    return this.request<Character[]>('/characters', {
      params: {
        worldId,
        sort,
      },
    });
  }
}

export const apiClient = new ApiClient();
