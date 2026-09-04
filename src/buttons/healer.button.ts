import type { ButtonInteraction } from 'discord.js';
import type { Button } from '../types/button';
import { handleLfgSignup } from '../helpers/lfg-signup-helpers';

const button: Button = {
  customId: 'healer',

  async execute(interaction: ButtonInteraction): Promise<void> {
    await handleLfgSignup(interaction, 'healer');
  },
};

export default button;
