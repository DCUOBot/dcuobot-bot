import { describe, expect, it, vi } from 'vitest';
import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { buildCommandsEmbed } from './commands-embed-helpers';
import type { Command, CommandData } from '../types/command';

vi.mock('../lib/config', () => ({
  config: {
    frontendUrl: 'https://dcuo.bot',
    discord: {
      embed: {
        color: '#9B59B6',
        author: 'DCUOBot',
        image: 'https://example.com/icon.png',
      },
    },
  },
}));

const noopExecute = async (_interaction: ChatInputCommandInteraction): Promise<void> => {};

const buildCommand = (
  name: string,
  description: string,
  configure?: (builder: SlashCommandBuilder) => CommandData,
): Command => {
  const builder = new SlashCommandBuilder().setName(name).setDescription(description);

  return {
    data: configure ? configure(builder) : builder,
    execute: noopExecute,
  };
};

const findField = (fields: { name: string; value: string }[], name: string) => {
  const field = fields.find((candidate) => candidate.name === name);

  if (!field) {
    throw new Error(`Field "${name}" not found`);
  }

  return field;
};

describe('buildCommandsEmbed', () => {
  it('sets title and description', () => {
    const embed = buildCommandsEmbed([]).toJSON();

    expect(embed.title).toBe('DCUOBot Commands');
    expect(embed.description).toBe('Here is a list of all available commands.');
  });

  it('applies the shared embed styling (color, author, timestamp)', () => {
    const embed = buildCommandsEmbed([]).toJSON();

    expect(embed.color).toBe(Number.parseInt('9B59B6', 16));
    expect(embed.author).toEqual({ name: 'DCUOBot', icon_url: 'https://example.com/icon.png' });
    expect(embed.timestamp).toBeTruthy();
  });

  it('adds one field per command, sorted alphabetically by name', () => {
    const commands = [
      buildCommand('servers', 'Check server status.'),
      buildCommand('info', 'Bot information.'),
    ];

    const fields = buildCommandsEmbed(commands).toJSON().fields ?? [];

    expect(fields.map((field) => field.name)).toEqual(['/info', '/servers']);
  });

  it('lists the description and a "no arguments" note for commands without options', () => {
    const commands = [buildCommand('info', 'Bot information.')];

    const fields = buildCommandsEmbed(commands).toJSON().fields ?? [];

    expect(findField(fields, '/info').value).toBe('Bot information.\n_No arguments._');
  });

  it('lists each option with its name, required/optional state, and description', () => {
    const commands = [
      buildCommand('character', 'Look up a character.', (builder) =>
        builder
          .addStringOption((option) =>
            option.setName('name').setDescription('The character name.').setRequired(true),
          )
          .addStringOption((option) =>
            option.setName('server').setDescription('The server.').setRequired(false),
          ),
      ),
    ];

    const fields = buildCommandsEmbed(commands).toJSON().fields ?? [];

    expect(findField(fields, '/character').value).toBe(
      'Look up a character.\n' +
        '`name` (required) - The character name.\n' +
        '`server` (optional) - The server.',
    );
  });
});
