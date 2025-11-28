import type { ICommand } from '../interfaces/ICommand';
import type { Message } from 'whatsapp-web.js';

/**
 * Dispatcher responsible for managing and executing commands
 */
class CommandDispatcher {
  private commands: Map<string, ICommand> = new Map();
  private aliases: Map<string, string> = new Map();

  /**
   * Registers a command in the dispatcher
   * @param command - Command instance to be registered
   */
  register(command: ICommand): void {
    this.commands.set(command.name, command);

    // Register aliases if they exist
    if (command.aliases && command.aliases.length > 0) {
      command.aliases.forEach((alias) => {
        this.aliases.set(alias, command.name);
      });
    }
  }

  /**
   * Dispatches a command for execution
   * @param commandName - Command name (or alias)
   * @param message - WhatsApp message
   * @param args - Command arguments
   */
  async dispatch(
    commandName: string,
    message: Message,
    args: string[],
  ): Promise<void> {
    // Resolve alias to real command name
    const resolvedName = this.aliases.get(commandName) || commandName;
    const command = this.commands.get(resolvedName);

    if (command) {
      try {
        await command.execute(message, args);
      } catch (error) {
        console.error(`❌ Error executing command '${resolvedName}':`, error);
        await message.reply(
          '⚠️ An error occurred while executing the command. Please try again later.',
        );
      }
    }
    // If command doesn't exist, do nothing (silent)
  }

  /**
   * Gets a command by name or alias
   */
  getCommand(name: string): ICommand | undefined {
    const resolvedName = this.aliases.get(name) || name;
    return this.commands.get(resolvedName);
  }

  /**
   * Returns all registered commands
   */
  getAllCommands(): ICommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Checks if a command exists
   */
  hasCommand(name: string): boolean {
    const resolvedName = this.aliases.get(name) || name;
    return this.commands.has(resolvedName);
  }
}

export const commandDispatcher = new CommandDispatcher();

