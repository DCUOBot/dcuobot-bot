import type { ButtonInteraction } from 'discord.js';
import type { Button } from '../types/button';
import { handleLfgSignup } from '../helpers/lfg/lfg-signup-helpers';

const button: Button = {
  customId: 'dps',

  async execute(interaction: ButtonInteraction): Promise<void> {
    await handleLfgSignup(interaction, 'dps');
  },
};

export default button;
