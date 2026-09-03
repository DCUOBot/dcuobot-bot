import { Events, GatewayIntentBits, MessageFlags } from 'discord.js';
import { loadCommands } from './handlers/load-commands';
import { config } from './lib/config';
import { logger } from './lib/logger';
import { BotClient } from './structures/bot-client';

process.on('uncaughtException', (error) => {
  logger.error({ err: error }, 'Uncaught exception');
});

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});

const client = new BotClient({ intents: [GatewayIntentBits.Guilds] });

for (const command of await loadCommands()) {
  client.commands.set(command.data.name, command);
}

logger.info({ count: client.commands.size }, 'Loaded commands');

client.once(Events.ClientReady, (readyClient) => {
  logger.info({ tag: readyClient.user.tag }, 'Bot is ready');
});

client.on(Events.InteractionCreate, (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    logger.warn({ commandName: interaction.commandName }, 'Unknown command received');
    return;
  }

  command.execute(interaction).catch((error: unknown) => {
    logger.error({ err: error, commandName: interaction.commandName }, 'Command execution failed');

    const errorResponse = {
      content: 'There was an error while executing this command.',
      flags: MessageFlags.Ephemeral,
    } as const;

    const respond = interaction.replied || interaction.deferred
      ? interaction.followUp(errorResponse)
      : interaction.reply(errorResponse);

    respond.catch((followUpError: unknown) => {
      logger.error({ err: followUpError }, 'Failed to send error response');
    });
  });
});

await client.login(config.discord.botToken);
