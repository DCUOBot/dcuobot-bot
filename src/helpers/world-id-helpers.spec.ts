import { describe, expect, it } from 'vitest';
import { getServerByWorldId, getWorldIdByServer } from './world-id-helpers';

const SERVER_WORLD_PAIRS = [
  ['us', 2, 'USPC/PS'],
  ['eu', 4, 'EUPC/PS'],
  ['switchus', 10, 'US Switch'],
  ['switcheu', 11, 'EU Switch'],
  ['xbox', 5001, 'Xbox'],
] as const;

describe('getWorldIdByServer', () => {
  it.each(SERVER_WORLD_PAIRS)('maps server "%s" to world ID %i', (server, worldId) => {
    expect(getWorldIdByServer(server)).toBe(worldId);
  });

  it('is case-insensitive', () => {
    expect(getWorldIdByServer('US')).toBe(2);
    expect(getWorldIdByServer('SwitchEU')).toBe(11);
  });

  it('throws for an unknown server', () => {
    expect(() => getWorldIdByServer('mars')).toThrow('Invalid server.');
  });

  it('throws for an empty string', () => {
    expect(() => getWorldIdByServer('')).toThrow('Invalid server.');
  });
});

describe('getServerByWorldId', () => {
  it.each(SERVER_WORLD_PAIRS)('maps world ID %i to server "%s"', (_server, worldId, serverName) => {
    expect(getServerByWorldId(worldId)).toBe(serverName);
  });

  it('throws for an unknown world ID', () => {
    expect(() => getServerByWorldId(9999)).toThrow('Invalid world ID.');
  });
});
