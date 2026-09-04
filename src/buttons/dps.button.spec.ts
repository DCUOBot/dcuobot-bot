import { describe, expect, it, vi } from 'vitest';
import type { ButtonInteraction } from 'discord.js';
import button from './dps.button';
import { handleLfgSignup } from '../helpers/lfg/lfg-signup-helpers';

vi.mock('../helpers/lfg/lfg-signup-helpers', () => ({
  handleLfgSignup: vi.fn().mockResolvedValue(undefined),
}));

describe('dps button', () => {
  it('is registered under the "dps" customId', () => {
    expect(button.customId).toBe('dps');
  });

  it('delegates to handleLfgSignup for the dps role', async () => {
    const interaction = {} as ButtonInteraction;

    await button.execute(interaction);

    expect(handleLfgSignup).toHaveBeenCalledWith(interaction, 'dps');
  });
});
