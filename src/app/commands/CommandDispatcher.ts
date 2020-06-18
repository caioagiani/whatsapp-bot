import Command from "./Command";

export default class CommandDispatcher {
  private commandsHandlers: Map<string, Command<any>> = new Map();

  async register(name: string, command: Command<any>) {
    this.commandsHandlers.set(name, command);
  }

  async dispatch(name: string, message: any) {
    if (!this.commandsHandlers.has(name)) {
      return;
    }

    const command = this.commandsHandlers.get(name);
    await command.execute(message);
  }
}
