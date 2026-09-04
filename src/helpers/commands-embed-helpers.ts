import type { EmbedBuilder } from 'discord.js';
import type { Command } from '../types/command';
import { buildEmbed } from './embed-helpers';

interface CommandOption {
  name: string;
  description: string;
  required?: boolean;
}

const formatOption = (option: CommandOption): string =>
  `\`${option.name}\` (${option.required ? 'required' : 'optional'}) - ${option.description}`;

const formatCommandField = (command: Command): { name: string; value: string } => {
  const json = command.data.toJSON();
  const options = (json.options as CommandOption[] | undefined) ?? [];

  const argsList = options.length ? options.map(formatOption).join('\n') : '_No arguments._';

  return {
    name: `/${json.name}`,
    value: `${json.description}\n${argsList}`,
  };
};

export const buildCommandsEmbed = (commands: Command[]): EmbedBuilder =>
  commands
    .slice()
    .sort((a, b) => a.data.name.localeCompare(b.data.name))
    .reduce(
      (embed, command) => embed.addFields(formatCommandField(command)),
      buildEmbed()
        .setTitle('DCUOBot Commands')
        .setDescription('Here is a list of all available commands.'),
    );
