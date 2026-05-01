import axios from 'axios';
import type { Message } from 'whatsapp-web.js';
import { BaseCommand } from '../utils/BaseCommand';

interface ExchangeRate {
  name: string;
  code: string;
  bid: string;
  high: string;
  low: string;
}

/**
 * Command to query currency exchange rates
 */
export class EconomyCommand extends BaseCommand {
  name = 'cotacao';
  description = 'Shows current exchange rates (USD, BTC, EUR)';
  aliases = ['moeda', 'dolar', 'bitcoin'];

  async execute(message: Message, _args: string[]): Promise<Message> {
    await this.sendTyping(message);

    try {
      const { data } = await axios.get<Record<string, ExchangeRate>>(
        'https://economia.awesomeapi.com.br/all/USD-BRL,BTC-BRL,EUR-BRL',
      );

      if (!data || typeof data !== 'object') {
        return message.reply(
          '⚠️ Unable to get exchange rates at the moment. Please try again later.',
        );
      }

      const getAllCurrencies = () => {
        return Object.keys(data)
          .map((key) => {
            const rate = data[key];
            return `\n💲 *${rate.name} (${rate.code})* \nCurrent value: R$ ${rate.bid} \nHighest value: R$ ${rate.high} \nLowest value: R$ ${rate.low}\n`;
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
