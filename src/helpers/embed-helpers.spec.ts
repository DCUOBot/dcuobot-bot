import { EmbedBuilder } from 'discord.js';
import { describe, expect, it, vi } from 'vitest';
import { buildEmbed } from './embed-helpers';

vi.mock('../lib/config', () => ({
  config: {
    discord: {
      embed: {
        color: '#9B59B6',
        author: 'DCUOBot',
        image: 'https://example.com/icon.png',
      },
    },
  },
}));

describe('buildEmbed', () => {
  it('returns an EmbedBuilder instance', () => {
    expect(buildEmbed()).toBeInstanceOf(EmbedBuilder);
  });

  it('applies the configured color, author and icon', () => {
    const embed = buildEmbed().toJSON();

    expect(embed.color).toBe(Number.parseInt('9B59B6', 16));
    expect(embed.author).toEqual({ name: 'DCUOBot', icon_url: 'https://example.com/icon.png' });
  });

  it('sets a timestamp', () => {
    const embed = buildEmbed().toJSON();

    expect(embed.timestamp).toBeTruthy();
  });

  it('returns a fresh embed on every call', () => {
    const first = buildEmbed().setTitle('First');
    const second = buildEmbed();

    expect(second.toJSON().title).toBeUndefined();
    expect(first.toJSON().title).toBe('First');
  });
});
