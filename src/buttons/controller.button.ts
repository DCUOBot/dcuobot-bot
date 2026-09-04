import type { ButtonInteraction } from 'discord.js';
import type { Button } from '../types/button';
import { handleLfgSignup } from '../helpers/lfg-signup-helpers';

const button: Button = {
  customId: 'controller',

  async execute(interaction: ButtonInteraction): Promise<void> {
    await handleLfgSignup(interaction, 'controller');
  },
};

export default button;
