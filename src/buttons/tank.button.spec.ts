import { describe, expect, it, vi } from 'vitest';
import type { ButtonInteraction } from 'discord.js';
import button from './tank.button';
import { handleLfgSignup } from '../helpers/lfg-signup-helpers';

vi.mock('../helpers/lfg-signup-helpers', () => ({
  handleLfgSignup: vi.fn().mockResolvedValue(undefined),
}));

describe('tank button', () => {
  it('is registered under the "tank" customId', () => {
    expect(button.customId).toBe('tank');
  });

  it('delegates to handleLfgSignup for the tank role', async () => {
    const interaction = {} as ButtonInteraction;

    await button.execute(interaction);

    expect(handleLfgSignup).toHaveBeenCalledWith(interaction, 'tank');
  });
});
