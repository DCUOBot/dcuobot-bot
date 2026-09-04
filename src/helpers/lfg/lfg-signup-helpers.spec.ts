import { describe, expect, it, vi } from 'vitest';
import type { ButtonInteraction } from 'discord.js';
import { handleLfgSignup } from './lfg-signup-helpers';
import { LFG_ROLES } from './lfg-roles';

vi.mock('../../lib/config', () => ({
  config: {
    discord: {
      embed: {
        color: '#9B59B6',
        author: 'DCUOBot',
        image: 'https://example.com/icon.png',
      },
      emojis: {
        tank: '<:r_:1088024461778890772>',
        healer: '<:r_:1088024463070744698>',
        controller: '<:r_:1088024465008500788>',
        dps: '<:r_:1088024466291949599>',
      },
    },
  },
}));

const roleByKey = (key: string) => LFG_ROLES.find((role) => role.key === key)!;

const buildField = (roleKey: string, slots: string[], maxAmount: number) => {
  const role = roleByKey(roleKey);
  const current = slots.filter((slot) => slot !== '-').length;

  return {
    name: `${role.emoji} ${role.label} (${current}/${maxAmount})`,
    value: slots.join('\n'),
    inline: false,
  };
};

const buildOldEmbed = (
  overrides: {
    title?: string | null;
    description?: string | null;
    tanks?: string[];
    healers?: string[];
    controllers?: string[];
    dps?: string[];
    maxTanks?: number;
    maxHealers?: number;
    maxControllers?: number;
    maxDps?: number;
  } = {},
) => ({
  title: overrides.title ?? ':mag: LFG Throne of the Dead King',
  description: overrides.description ?? 'Created by `Batman`.',
  fields: [
    buildField('tank', overrides.tanks ?? ['-'], overrides.maxTanks ?? 2),
    buildField('healer', overrides.healers ?? ['-'], overrides.maxHealers ?? 1),
    buildField('controller', overrides.controllers ?? ['-'], overrides.maxControllers ?? 1),
    buildField('dps', overrides.dps ?? ['-'], overrides.maxDps ?? 4),
  ],
});

const createInteraction = (
  overrides: {
    username?: string;
    embed?: ReturnType<typeof buildOldEmbed> | null;
  } = {},
) => {
  const embed = overrides.embed === null ? undefined : (overrides.embed ?? buildOldEmbed());

  return {
    deferReply: vi.fn().mockResolvedValue(undefined),
    editReply: vi.fn().mockResolvedValue(undefined),
    user: { username: overrides.username ?? 'Batman' },
    message: {
      embeds: embed ? [embed] : [],
      edit: vi.fn().mockResolvedValue(undefined),
    },
  } as unknown as ButtonInteraction;
};

const findField = (
  interaction: ButtonInteraction,
  roleKey: string,
): { name: string; value: string } => {
  const role = roleByKey(roleKey);
  const editCall = vi.mocked(interaction.message.edit).mock.calls[0]?.[0] as {
    embeds: [{ data: { fields: { name: string; value: string }[] } }];
  };
  const field = editCall.embeds[0].data.fields.find((candidate) =>
    candidate.name.startsWith(role.emoji),
  );

  if (!field) {
    throw new Error(`Field for role "${roleKey}" not found in the rebuilt embed`);
  }

  return field;
};

describe('handleLfgSignup', () => {
  it('defers an ephemeral reply', async () => {
    const interaction = createInteraction();

    await handleLfgSignup(interaction, 'tank');

    expect(interaction.deferReply).toHaveBeenCalledWith({ flags: 64 });
  });

  it('replies with an error and does not edit the message when there is no embed', async () => {
    const interaction = createInteraction({ embed: null });

    await handleLfgSignup(interaction, 'tank');

    expect(interaction.editReply).toHaveBeenCalledWith('There is no embed to edit.');
    expect(interaction.message.edit).not.toHaveBeenCalled();
  });

  it('replies with an error and does not edit the message when a role field is missing', async () => {
    const embed = buildOldEmbed();
    embed.fields = embed.fields.slice(0, 3);
    const interaction = createInteraction({ embed });

    await handleLfgSignup(interaction, 'tank');

    expect(interaction.editReply).toHaveBeenCalledWith('This LFG embed could not be read.');
    expect(interaction.message.edit).not.toHaveBeenCalled();
  });

  it('replies with an error and does not edit the message when a field has no parseable capacity', async () => {
    const embed = buildOldEmbed();
    embed.fields[0] = { name: `${roleByKey('tank').emoji} Tank`, value: '-', inline: false };
    const interaction = createInteraction({ embed });

    await handleLfgSignup(interaction, 'tank');

    expect(interaction.editReply).toHaveBeenCalledWith('This LFG embed could not be read.');
    expect(interaction.message.edit).not.toHaveBeenCalled();
  });

  describe('signing up for a role', () => {
    it('fills the first empty slot and confirms the signup', async () => {
      const interaction = createInteraction({ embed: buildOldEmbed({ tanks: ['-'] }) });

      await handleLfgSignup(interaction, 'tank');

      expect(findField(interaction, 'tank').value).toBe('Batman');
      expect(interaction.editReply).toHaveBeenCalledWith('You have signed up as Tank.');
    });

    it('appends to an existing roster without discarding other members', async () => {
      const interaction = createInteraction({
        embed: buildOldEmbed({ tanks: ['Robin'], maxTanks: 2 }),
      });

      await handleLfgSignup(interaction, 'tank');

      expect(findField(interaction, 'tank').value).toBe('Robin\nBatman');
    });

    it('rejects when the role is full, without editing the message', async () => {
      const interaction = createInteraction({
        embed: buildOldEmbed({ tanks: ['Robin', 'Nightwing'], maxTanks: 2 }),
      });

      await handleLfgSignup(interaction, 'tank');

      expect(interaction.editReply).toHaveBeenCalledWith('There are no tanks spots left.');
      expect(interaction.message.edit).not.toHaveBeenCalled();
    });

    it('moves the user from their old role to the new one when switching roles', async () => {
      const interaction = createInteraction({
        embed: buildOldEmbed({ tanks: ['Batman'], healers: ['-'] }),
      });

      await handleLfgSignup(interaction, 'healer');

      expect(findField(interaction, 'tank').value).toBe('-');
      expect(findField(interaction, 'healer').value).toBe('Batman');
      expect(interaction.editReply).toHaveBeenCalledWith('You have signed up as Healer.');
    });

    it('keeps the user in their old role when the target role is full', async () => {
      const interaction = createInteraction({
        embed: buildOldEmbed({ tanks: ['Batman'], healers: ['Robin'], maxHealers: 1 }),
      });

      await handleLfgSignup(interaction, 'healer');

      expect(interaction.editReply).toHaveBeenCalledWith('There are no healers spots left.');
      expect(interaction.message.edit).not.toHaveBeenCalled();
    });

    it('toggles the user out when they click the role they are already signed up for, even if it is full', async () => {
      const interaction = createInteraction({
        embed: buildOldEmbed({ tanks: ['Batman', 'Nightwing'], maxTanks: 2 }),
      });

      await handleLfgSignup(interaction, 'tank');

      expect(findField(interaction, 'tank').value).toBe('Nightwing');
      expect(interaction.editReply).toHaveBeenCalledWith('You have signed out.');
    });
  });

  describe('signing out', () => {
    it('replies with an error and does not edit the message when the user is not signed up', async () => {
      const interaction = createInteraction({ embed: buildOldEmbed() });

      await handleLfgSignup(interaction, null);

      expect(interaction.editReply).toHaveBeenCalledWith("You aren't signed up.");
      expect(interaction.message.edit).not.toHaveBeenCalled();
    });

    it('removes the user from whichever role they were signed up for', async () => {
      const interaction = createInteraction({
        embed: buildOldEmbed({ healers: ['Batman', 'Robin'] }),
      });

      await handleLfgSignup(interaction, null);

      expect(findField(interaction, 'healer').value).toBe('Robin');
      expect(interaction.editReply).toHaveBeenCalledWith('You have signed out.');
    });

    it('resets a now-empty roster back to the empty slot placeholder', async () => {
      const interaction = createInteraction({ embed: buildOldEmbed({ dps: ['Batman'] }) });

      await handleLfgSignup(interaction, null);

      expect(findField(interaction, 'dps').value).toBe('-');
    });
  });

  it('preserves the original title and description instead of regenerating them', async () => {
    const interaction = createInteraction({
      embed: buildOldEmbed({
        title: ':mag: LFG Some Instance',
        description: 'Created by `Robin`.',
      }),
    });

    await handleLfgSignup(interaction, 'tank');

    const editCall = vi.mocked(interaction.message.edit).mock.calls[0]?.[0] as {
      embeds: [{ data: { title: string; description: string } }];
    };
    expect(editCall.embeds[0].data.title).toBe(':mag: LFG Some Instance');
    expect(editCall.embeds[0].data.description).toBe('Created by `Robin`.');
  });
});
