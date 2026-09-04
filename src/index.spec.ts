import { Events, GatewayIntentBits, MessageFlags } from 'discord.js';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';

const { mockClientInstance, MockBotClient } = vi.hoisted(() => {
  const mockClientInstance = {
    commands: new Map<string, { execute: (...args: unknown[]) => Promise<void> }>(),
    buttons: new Map<string, { execute: (...args: unknown[]) => Promise<void> }>(),
    once: vi.fn(),
    on: vi.fn(),
    login: vi.fn().mockResolvedValue(undefined),
  };
  const MockBotClient = vi.fn(function MockBotClient() {
    return mockClientInstance;
  });

  return { mockClientInstance, MockBotClient };
});

vi.mock('./structures/bot-client', () => ({
  BotClient: MockBotClient,
}));

vi.mock('./handlers/load-commands', () => ({
  loadCommands: vi.fn(),
}));

vi.mock('./handlers/load-buttons', () => ({
  loadButtons: vi.fn(),
}));

vi.mock('./lib/config', () => ({
  config: { discord: { botToken: 'mock-bot-token' } },
}));

vi.mock('./lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

type FakeCommand = { data: { name: string }; execute: ReturnType<typeof vi.fn> };
type FakeButton = { customId: string; execute: ReturnType<typeof vi.fn> };

const buildCommand = (
  name: string,
  execute = vi.fn().mockResolvedValue(undefined),
): FakeCommand => ({
  data: { name },
  execute,
});

const buildButton = (
  customId: string,
  execute = vi.fn().mockResolvedValue(undefined),
): FakeButton => ({
  customId,
  execute,
});

const buildInteraction = (
  overrides: {
    isChatInputCommand?: boolean;
    isButton?: boolean;
    commandName?: string;
    customId?: string;
    replied?: boolean;
    deferred?: boolean;
    reply?: ReturnType<typeof vi.fn>;
    followUp?: ReturnType<typeof vi.fn>;
  } = {},
) => ({
  isChatInputCommand: vi.fn().mockReturnValue(overrides.isChatInputCommand ?? true),
  isButton: vi.fn().mockReturnValue(overrides.isButton ?? false),
  commandName: overrides.commandName ?? 'test-command',
  customId: overrides.customId ?? 'test-button-1234567890',
  replied: overrides.replied ?? false,
  deferred: overrides.deferred ?? false,
  reply: overrides.reply ?? vi.fn().mockResolvedValue(undefined),
  followUp: overrides.followUp ?? vi.fn().mockResolvedValue(undefined),
});

const flush = () => new Promise((resolve) => setImmediate(resolve));

const runIndex = async (commands: FakeCommand[] = [], buttons: FakeButton[] = []) => {
  const { loadCommands } = await import('./handlers/load-commands');
  vi.mocked(loadCommands).mockResolvedValue(commands as never);

  const { loadButtons } = await import('./handlers/load-buttons');
  vi.mocked(loadButtons).mockResolvedValue(buttons as never);

  const { logger } = await import('./lib/logger');

  await import('./index');

  return { logger };
};

const getOnceHandler = (event: string) =>
  mockClientInstance.once.mock.calls.find(
    ([registeredEvent]) => registeredEvent === event,
  )?.[1] as (...args: unknown[]) => void;

const getOnHandler = (event: string) =>
  mockClientInstance.on.mock.calls.find(([registeredEvent]) => registeredEvent === event)?.[1] as (
    ...args: unknown[]
  ) => void;

describe('index', () => {
  let processOnSpy: MockInstance<typeof process.on>;

  beforeEach(() => {
    vi.resetModules();
    mockClientInstance.commands.clear();
    mockClientInstance.buttons.clear();
    mockClientInstance.once.mockClear();
    mockClientInstance.on.mockClear();
    mockClientInstance.login.mockClear();
    mockClientInstance.login.mockResolvedValue(undefined);
    MockBotClient.mockClear();

    processOnSpy = vi.spyOn(process, 'on').mockImplementation(() => process);
  });

  afterEach(() => {
    processOnSpy.mockRestore();
  });

  it('constructs the BotClient with the Guilds intent', async () => {
    await runIndex();

    expect(MockBotClient).toHaveBeenCalledWith({ intents: [GatewayIntentBits.Guilds] });
  });

  it('registers uncaughtException and unhandledRejection handlers', async () => {
    const { logger } = await runIndex();

    const calls = processOnSpy.mock.calls as [string, (...args: unknown[]) => void][];
    const uncaughtHandler = calls.find((call) => call[0] === 'uncaughtException')?.[1] as (
      error: Error,
    ) => void;
    const rejectionHandler = calls.find((call) => call[0] === 'unhandledRejection')?.[1] as (
      reason: unknown,
    ) => void;

    const error = new Error('boom');
    uncaughtHandler(error);
    expect(logger.error).toHaveBeenCalledWith({ err: error }, 'Uncaught exception');

    rejectionHandler('some reason');
    expect(logger.error).toHaveBeenCalledWith(
      { err: 'some reason' },
      'Unhandled promise rejection',
    );
  });

  it('loads commands, registers them by name, and logs the count', async () => {
    const characterCommand = buildCommand('character');
    const pingCommand = buildCommand('ping');

    const { logger } = await runIndex([characterCommand, pingCommand]);

    expect(mockClientInstance.commands.get('character')).toBe(characterCommand);
    expect(mockClientInstance.commands.get('ping')).toBe(pingCommand);
    expect(mockClientInstance.commands.size).toBe(2);
    expect(logger.info).toHaveBeenCalledWith({ count: 2 }, 'Loaded commands');
  });

  it('loads buttons, registers them by customId, and logs the count', async () => {
    const tankButton = buildButton('tank');
    const signOutButton = buildButton('signOut');

    const { logger } = await runIndex([], [tankButton, signOutButton]);

    expect(mockClientInstance.buttons.get('tank')).toBe(tankButton);
    expect(mockClientInstance.buttons.get('signOut')).toBe(signOutButton);
    expect(mockClientInstance.buttons.size).toBe(2);
    expect(logger.info).toHaveBeenCalledWith({ count: 2 }, 'Loaded buttons');
  });

  it('logs when the bot becomes ready', async () => {
    const { logger } = await runIndex();

    const readyHandler = getOnceHandler(Events.ClientReady);
    readyHandler({ user: { tag: 'DCUOBot#0001' } });

    expect(logger.info).toHaveBeenCalledWith({ tag: 'DCUOBot#0001' }, 'Bot is ready');
  });

  it('logs into Discord with the configured bot token', async () => {
    await runIndex();

    expect(mockClientInstance.login).toHaveBeenCalledWith('mock-bot-token');
  });

  describe('InteractionCreate handler — commands', () => {
    it('ignores interactions that are neither chat input commands nor buttons', async () => {
      const { logger } = await runIndex();
      const handler = getOnHandler(Events.InteractionCreate);

      const interaction = buildInteraction({ isChatInputCommand: false, isButton: false });
      handler(interaction);
      await flush();

      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('warns and does nothing for an unknown command', async () => {
      const { logger } = await runIndex();
      const handler = getOnHandler(Events.InteractionCreate);

      const interaction = buildInteraction({ commandName: 'nonexistent' });
      handler(interaction);
      await flush();

      expect(logger.warn).toHaveBeenCalledWith(
        { commandName: 'nonexistent' },
        'Unknown command received',
      );
    });

    it('executes the matched command', async () => {
      const execute = vi.fn().mockResolvedValue(undefined);
      const command = buildCommand('character', execute);
      const { logger } = await runIndex([command]);
      const handler = getOnHandler(Events.InteractionCreate);

      const interaction = buildInteraction({ commandName: 'character' });
      handler(interaction);
      await flush();

      expect(execute).toHaveBeenCalledWith(interaction);
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('logs and replies with a generic error when execute rejects and the interaction has no reply yet', async () => {
      const executeError = new Error('command exploded');
      const command = buildCommand('character', vi.fn().mockRejectedValue(executeError));
      const { logger } = await runIndex([command]);
      const handler = getOnHandler(Events.InteractionCreate);

      const interaction = buildInteraction({
        commandName: 'character',
        replied: false,
        deferred: false,
      });
      handler(interaction);
      await flush();

      expect(logger.error).toHaveBeenCalledWith(
        { err: executeError, commandName: 'character' },
        'Command execution failed',
      );
      expect(interaction.reply).toHaveBeenCalledWith({
        content: 'There was an error while executing this command.',
        flags: MessageFlags.Ephemeral,
      });
      expect(interaction.followUp).not.toHaveBeenCalled();
    });

    it('follows up instead of replying when the interaction was already replied or deferred', async () => {
      const command = buildCommand(
        'character',
        vi.fn().mockRejectedValue(new Error('command exploded')),
      );
      await runIndex([command]);
      const handler = getOnHandler(Events.InteractionCreate);

      const interaction = buildInteraction({ commandName: 'character', deferred: true });
      handler(interaction);
      await flush();

      expect(interaction.followUp).toHaveBeenCalledWith({
        content: 'There was an error while executing this command.',
        flags: MessageFlags.Ephemeral,
      });
      expect(interaction.reply).not.toHaveBeenCalled();
    });

    it('logs a second error when sending the error response itself fails', async () => {
      const command = buildCommand(
        'character',
        vi.fn().mockRejectedValue(new Error('command exploded')),
      );
      const { logger } = await runIndex([command]);
      const handler = getOnHandler(Events.InteractionCreate);

      const followUpError = new Error('discord is down');
      const interaction = buildInteraction({
        commandName: 'character',
        replied: false,
        deferred: false,
        reply: vi.fn().mockRejectedValue(followUpError),
      });
      handler(interaction);
      await flush();

      expect(logger.error).toHaveBeenCalledWith(
        { err: followUpError },
        'Failed to send error response',
      );
    });
  });

  describe('InteractionCreate handler — buttons', () => {
    it('warns and does nothing for an unknown button', async () => {
      const { logger } = await runIndex();
      const handler = getOnHandler(Events.InteractionCreate);

      const interaction = buildInteraction({
        isChatInputCommand: false,
        isButton: true,
        customId: 'nonexistent-1234567890',
      });
      handler(interaction);
      await flush();

      expect(logger.warn).toHaveBeenCalledWith(
        { customId: 'nonexistent-1234567890' },
        'Unknown button interaction received',
      );
    });

    it('routes to the button registered under the customId prefix, ignoring the trailing interaction id', async () => {
      const execute = vi.fn().mockResolvedValue(undefined);
      const button = buildButton('tank', execute);
      await runIndex([], [button]);
      const handler = getOnHandler(Events.InteractionCreate);

      const interaction = buildInteraction({
        isChatInputCommand: false,
        isButton: true,
        customId: 'tank-1234567890',
      });
      handler(interaction);
      await flush();

      expect(execute).toHaveBeenCalledWith(interaction);
    });

    it('logs and replies with a generic error when a button execute rejects and the interaction has no reply yet', async () => {
      const executeError = new Error('button exploded');
      const button = buildButton('tank', vi.fn().mockRejectedValue(executeError));
      const { logger } = await runIndex([], [button]);
      const handler = getOnHandler(Events.InteractionCreate);

      const interaction = buildInteraction({
        isChatInputCommand: false,
        isButton: true,
        customId: 'tank-1234567890',
        replied: false,
        deferred: false,
      });
      handler(interaction);
      await flush();

      expect(logger.error).toHaveBeenCalledWith(
        { err: executeError, customId: 'tank-1234567890' },
        'Button execution failed',
      );
      expect(interaction.reply).toHaveBeenCalledWith({
        content: 'There was an error while executing this command.',
        flags: MessageFlags.Ephemeral,
      });
      expect(interaction.followUp).not.toHaveBeenCalled();
    });

    it('follows up instead of replying when the button interaction was already replied or deferred', async () => {
      const button = buildButton('tank', vi.fn().mockRejectedValue(new Error('button exploded')));
      await runIndex([], [button]);
      const handler = getOnHandler(Events.InteractionCreate);

      const interaction = buildInteraction({
        isChatInputCommand: false,
        isButton: true,
        customId: 'tank-1234567890',
        deferred: true,
      });
      handler(interaction);
      await flush();

      expect(interaction.followUp).toHaveBeenCalledWith({
        content: 'There was an error while executing this command.',
        flags: MessageFlags.Ephemeral,
      });
      expect(interaction.reply).not.toHaveBeenCalled();
    });
  });
});
