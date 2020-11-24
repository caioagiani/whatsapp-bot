import Command from './Command';

export default class CommandDispatcher {
  private commandsHandlers: Map<string, Command<any>> = new Map();

  async register(name: string, command: Command<any>) {
    this.commandsHandlers.set(name, command);
  }

  async dispatch(name: string, message: any) {
    for (const [key, _] of this.commandsHandlers) {
      if (name.includes(key)) {
        if (!this.commandsHandlers.has(key)) {
          return;
        }

        const command = this.commandsHandlers.get(key);
        await command.execute(message);
      }
    }
  }
}
