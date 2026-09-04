import { describe, expect, it, vi } from 'vitest';
import { ButtonStyle } from 'discord.js';
import { buildLfgActionRow, buildLfgEmbed, type LfgRole } from './lfg-embed-helpers';

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

const buildRole = (overrides: Partial<LfgRole> = {}): LfgRole => ({
  key: 'tank',
  label: 'Tank',
  emoji: '<:r_:1088024461778890772>',
  maxAmount: 1,
  slots: ['-'],
  ...overrides,
});

describe('buildLfgEmbed', () => {
  it('sets title and description', () => {
    const embed = buildLfgEmbed('Throne of the Dead King', 'Batman', []).toJSON();

    expect(embed.title).toBe(':mag: LFG Throne of the Dead King');
    expect(embed.description).toBe('Created by `Batman`.');
  });

  it('applies the shared embed styling (color, author, timestamp)', () => {
    const embed = buildLfgEmbed('Instance', 'Batman', []).toJSON();

    expect(embed.color).toBe(Number.parseInt('9B59B6', 16));
    expect(embed.author).toEqual({ name: 'DCUOBot', icon_url: 'https://example.com/icon.png' });
    expect(embed.timestamp).toBeTruthy();
  });

  it('renders no fields when there are no roles', () => {
    const embed = buildLfgEmbed('Instance', 'Batman', []).toJSON();

    expect(embed.fields ?? []).toHaveLength(0);
  });

  it('renders a field per role with the emoji, label, an empty slot count, and a "-" value', () => {
    const role = buildRole({ emoji: ':shield:', label: 'Tank', maxAmount: 2, slots: ['-'] });
    const fields = buildLfgEmbed('Instance', 'Batman', [role]).toJSON().fields ?? [];

    expect(fields[0]?.name).toBe(':shield: Tank (0/2)');
    expect(fields[0]?.value).toBe('-');
  });

  it('counts filled slots and lists them, one per line, in the field value', () => {
    const role = buildRole({
      emoji: ':shield:',
      label: 'Tank',
      maxAmount: 3,
      slots: ['Batman', 'Robin'],
    });
    const fields = buildLfgEmbed('Instance', 'Batman', [role]).toJSON().fields ?? [];

    expect(fields[0]?.name).toBe(':shield: Tank (2/3)');
    expect(fields[0]?.value).toBe('Batman\nRobin');
  });

  it('renders one field per role, in order', () => {
    const roles = [
      buildRole({ emoji: ':shield:', label: 'Tank', maxAmount: 1, slots: ['-'] }),
      buildRole({ emoji: ':medkit:', label: 'Healer', maxAmount: 2, slots: ['-'] }),
    ];
    const fields = buildLfgEmbed('Instance', 'Batman', roles).toJSON().fields ?? [];

    expect(fields.map((field) => field.name)).toEqual([
      ':shield: Tank (0/1)',
      ':medkit: Healer (0/2)',
    ]);
  });
});

describe('buildLfgActionRow', () => {
  it('renders one button per role plus a sign-out button', () => {
    const roles = [buildRole({ key: 'tank' }), buildRole({ key: 'healer' })];
    const row = buildLfgActionRow('123', roles).toJSON();

    expect(row.components).toHaveLength(3);
  });

  it('builds each role button with a role-scoped custom id, label, emoji, and secondary style', () => {
    const role = buildRole({ key: 'tank', label: 'Tank', emoji: '<:r_:1088024461778890772>' });
    const row = buildLfgActionRow('123', [role]).toJSON();
    const [tankButton] = row.components;

    expect(tankButton).toMatchObject({
      custom_id: 'tank-123',
      label: 'Tank',
      style: ButtonStyle.Secondary,
      emoji: { id: '1088024461778890772', name: 'r_', animated: false },
    });
  });

  it('renders buttons for multiple roles in order, scoped to their own keys', () => {
    const roles = [buildRole({ key: 'tank' }), buildRole({ key: 'healer' })];
    const row = buildLfgActionRow('123', roles).toJSON();

    expect(row.components[0]).toMatchObject({ custom_id: 'tank-123' });
    expect(row.components[1]).toMatchObject({ custom_id: 'healer-123' });
  });

  it('always appends a danger-styled sign-out button scoped to the interaction, after the role buttons', () => {
    const row = buildLfgActionRow('123', [buildRole()]).toJSON();
    const signOutButton = row.components.at(-1);

    expect(signOutButton).toMatchObject({
      custom_id: 'signOut-123',
      label: 'Sign out',
      style: ButtonStyle.Danger,
    });
  });

  it('renders just the sign-out button when there are no roles', () => {
    const row = buildLfgActionRow('123', []).toJSON();

    expect(row.components).toHaveLength(1);
    expect(row.components[0]).toMatchObject({ custom_id: 'signOut-123' });
  });
});
