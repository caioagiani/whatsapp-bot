import axios from 'axios';
import type { Message } from 'whatsapp-web.js';
import { BaseCommand } from '../utils/BaseCommand';

/**
 * Comando para consultar cotações de moedas
 */
export class EconomyCommand extends BaseCommand {
  name = 'cotacao';
  description = 'Mostra cotação atual de moedas (USD, BTC, EUR)';
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
            return `\n💲 *${data[key].name} (${data[key].code})* \nValor atual: R$ ${data[key].bid} \nValor mais alto: R$ ${data[key].high} \nValor mais baixo: R$ ${data[key].low}\n`;
          })
          .join('');
      };

      return message.reply(`💎 *Cotação Atual* 💰🤑💹 \n${getAllCurrencies()}`);
    } catch (error) {
      console.error('Erro ao buscar cotações:', error);
      return message.reply(
        '⚠️ Não foi possível obter as cotações no momento. Tente novamente mais tarde.',
      );
    }
  }
}

