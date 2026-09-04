import { describe, expect, it, vi } from 'vitest';
import type { ButtonInteraction } from 'discord.js';
import button from './healer.button';
import { handleLfgSignup } from '../helpers/lfg-signup-helpers';

vi.mock('../helpers/lfg-signup-helpers', () => ({
  handleLfgSignup: vi.fn().mockResolvedValue(undefined),
}));

describe('healer button', () => {
  it('is registered under the "healer" customId', () => {
    expect(button.customId).toBe('healer');
  });

  it('delegates to handleLfgSignup for the healer role', async () => {
    const interaction = {} as ButtonInteraction;

    await button.execute(interaction);

    expect(handleLfgSignup).toHaveBeenCalledWith(interaction, 'healer');
  });
});
