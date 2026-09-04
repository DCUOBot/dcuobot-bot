import { apiClient } from '../lib/api-client';
import { buildCharacterEmbed } from '../helpers/character/character-embed-helpers';
import { buildLookupCommand } from '../handlers/build-lookup-command';

const isExactMatch = (characterName: string, query: string): boolean =>
  characterName.trim().toLowerCase() === query.trim().toLowerCase();

const command = buildLookupCommand({
  name: 'character',
  description: 'Look up a characters skill points, combat rating and more.',
  nameOptionDescription: 'The name of the character to look up.',
  serverOptionDescription: 'The server the character is on.',
  fetch: (name, worldId) => apiClient.getCharacter(name, worldId),
  buildEmbed: (interaction, character) => buildCharacterEmbed(interaction.client, character),
  buildContent: (character, query) =>
    isExactMatch(character.name, query)
      ? null
      : `Couldn't find a character with the name \`${query}\` (might be inactive/deleted, did you mean this one?`,
});

export default command;
