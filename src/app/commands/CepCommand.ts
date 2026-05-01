import axios from 'axios';
import type { IServerData } from '../interfaces/Cep';
import type { Message } from 'whatsapp-web.js';
import { BaseCommand } from '../utils/BaseCommand';

/**
 * Command to query postal code information
 */
export class CepCommand extends BaseCommand {
  name = 'cep';
  description = 'Search information for a Brazilian postal code';

  async execute(message: Message, args: string[]): Promise<Message> {
    await this.sendTyping(message);

    // Validate arguments
    if (args.length === 0) {
      return message.reply(
        '⚠️ Please provide a postal code.\n\n📖 *Usage:* !cep 01310-100',
      );
    }

    const cep = args[0].replace(/\D/g, ''); // Remove non-numeric characters

    if (cep.length !== 8) {
      return message.reply(
        '⚠️ Invalid postal code! The code must have 8 digits.',
      );
    }

    try {
      const { data } = await axios.get<IServerData>(
        `https://brasilapi.com.br/api/cep/v1/${cep}`,
      );

      return message.reply(
        `📮 *Postal Code Information*\n\n` +
          `*Postal Code:* ${data.cep}\n` +
          `*Street:* ${data.street}\n` +
          `*Neighborhood:* ${data.neighborhood}\n` +
          `*City:* ${data.city}\n` +
          `*State:* ${data.state}`,
      );
    } catch (error) {
      console.error('Error fetching postal code:', error);
      return message.reply('⚠️ Postal code not found or service unavailable.');
    }
  }
}
