import Command from './Command';

class CommandDispatcher {
  private commandsHandlers: Map<string, Command<string>> = new Map();

  async register(name: string, command: Command<string>) {
    this.commandsHandlers.set(name, command);
  }

  async dispatch(name: string, message: string) {
    for (const [key, command] of this.commandsHandlers) {
      if (name.includes(key)) command.execute(message);
    }
  }
}

export const commandDispatcher = new CommandDispatcher();
