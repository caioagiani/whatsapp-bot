import type { Message } from 'whatsapp-web.js';

/**
 * Base interface for all bot commands
 */
export interface ICommand {
  /**
   * Command name (without the ! prefix)
   * Example: 'cotacao', 'cep', 'perfil'
   */
  name: string;

  /**
   * Command description for help display
   */
  description: string;

  /**
   * Alternative aliases for the command
   * Example: ['moeda', 'dolar'] for the 'cotacao' command
   */
  aliases?: string[];

  /**
   * Executes the command
   * @param message - WhatsApp message that triggered the command
   * @param args - Arguments passed after the command name
   * @returns Promise that resolves when the command finishes
   */
  execute(message: Message, args: string[]): Promise<Message | void>;
}
