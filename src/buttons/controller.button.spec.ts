import { describe, expect, it, vi } from 'vitest';
import type { ButtonInteraction } from 'discord.js';
import button from './controller.button';
import { handleLfgSignup } from '../helpers/lfg-signup-helpers';

vi.mock('../helpers/lfg-signup-helpers', () => ({
  handleLfgSignup: vi.fn().mockResolvedValue(undefined),
}));

describe('controller button', () => {
  it('is registered under the "controller" customId', () => {
    expect(button.customId).toBe('controller');
  });

  it('delegates to handleLfgSignup for the controller role', async () => {
    const interaction = {} as ButtonInteraction;

    await button.execute(interaction);

    expect(handleLfgSignup).toHaveBeenCalledWith(interaction, 'controller');
  });
});
