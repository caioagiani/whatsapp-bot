import type { Message, Chat } from 'whatsapp-web.js';
import type { ICommand } from '../interfaces/ICommand';

/**
 * Abstract base class for commands
 * Provides common functionality for all commands
 */
export abstract class BaseCommand implements ICommand {
  abstract name: string;
  abstract description: string;
  aliases?: string[];

  abstract execute(message: Message, args: string[]): Promise<Message | void>;

  /**
   * Sends "typing..." state in the chat
   */
  protected async sendTyping(message: Message): Promise<void> {
    const chat = await message.getChat();
    await chat.sendStateTyping();
  }

  /**
   * Checks if the message was sent in a group
   */
  protected async isGroup(message: Message): Promise<boolean> {
    const chat = await message.getChat();
    return chat.isGroup;
  }

  /**
   * Gets the chat from the message
   */
  protected async getChat(message: Message): Promise<Chat> {
    return message.getChat();
  }

  /**
   * Validates if the command is being executed in a group
   * Returns error message if not
   */
  protected async requireGroup(message: Message): Promise<Message | null> {
    const isGroup = await this.isGroup(message);
    if (!isGroup) {
      return message.reply('⚠️ This command can only be used in groups!');
    }
    return null;
  }

  /**
   * Validates if there are enough arguments
   */
  protected validateArgs(
    message: Message,
    args: string[],
    minArgs: number,
    usage: string,
  ): Message | null {
    if (args.length < minArgs) {
      message.reply(`⚠️ Incorrect usage!\n\n📖 *Usage:* ${usage}`);
      return message as any;
    }
    return null;
  }
}
