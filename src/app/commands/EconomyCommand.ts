import axios from 'axios';
import type { Message } from 'whatsapp-web.js';
import { BaseCommand } from '../utils/BaseCommand';

/**
 * Command to query currency exchange rates
 */
export class EconomyCommand extends BaseCommand {
  name = 'cotacao';
  description = 'Shows current exchange rates (USD, BTC, EUR)';
  aliases = ['moeda', 'dolar', 'bitcoin'];

  async execute(message: Message, args: string[]): Promise<Message> {
    await this.sendTyping(message);

    try {
      const { data } = await axios.get(
        'https://economia.awesomeapi.com.br/all/USD-BRL,BTC-BRL,EUR-BRL',
      );

      const getAllCurrencies = () => {
        return Object.keys(data)
          .map((key) => {
            return `\n💲 *${data[key].name} (${data[key].code})* \nCurrent value: R$ ${data[key].bid} \nHighest value: R$ ${data[key].high} \nLowest value: R$ ${data[key].low}\n`;
          })
          .join('');
      };

      return message.reply(
        `💎 *Current Exchange Rates* 💰🤑💹 \n${getAllCurrencies()}`,
      );
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      return message.reply(
        '⚠️ Unable to get exchange rates at the moment. Please try again later.',
      );
    }
  }
}
