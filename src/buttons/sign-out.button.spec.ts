import { describe, expect, it, vi } from 'vitest';
import type { ButtonInteraction } from 'discord.js';
import button from './sign-out.button';
import { handleLfgSignup } from '../helpers/lfg-signup-helpers';

vi.mock('../helpers/lfg-signup-helpers', () => ({
  handleLfgSignup: vi.fn().mockResolvedValue(undefined),
}));

describe('sign-out button', () => {
  it('is registered under the "signOut" customId', () => {
    expect(button.customId).toBe('signOut');
  });

  it('delegates to handleLfgSignup with no role, to remove the user from every roster', async () => {
    const interaction = {} as ButtonInteraction;

    await button.execute(interaction);

    expect(handleLfgSignup).toHaveBeenCalledWith(interaction, null);
  });
});
