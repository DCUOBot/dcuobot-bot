import type { ButtonInteraction } from 'discord.js';

export interface Button {
  readonly customId: string;

  execute(interaction: ButtonInteraction): Promise<void>;
}
