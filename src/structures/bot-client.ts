import { Client, Collection, type ClientOptions } from 'discord.js';
import type { Command } from '../types/command';

export class BotClient extends Client {
  public readonly commands = new Collection<string, Command>();

  public constructor(options: ClientOptions) {
    super(options);
  }
}
