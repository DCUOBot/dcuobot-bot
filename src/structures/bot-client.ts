import { Client, Collection, type ClientOptions } from 'discord.js';
import type { Command } from '../types/command';
import type { Button } from '../types/button';

export class BotClient extends Client {
  public readonly commands = new Collection<string, Command>();
  public readonly buttons = new Collection<string, Button>();

  public constructor(options: ClientOptions) {
    super(options);
  }
}
