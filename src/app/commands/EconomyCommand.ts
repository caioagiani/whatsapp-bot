import axios from 'axios';
import { IMessage } from '../interfaces/Message';
import { ICurrency } from '../interfaces/Currency';

export default class EconomyCommand {
  async execute(msg: IMessage) {
    const chat = await msg.getChat();

    chat.sendStateTyping();

    const { data } = await axios.get(
      'https://economia.awesomeapi.com.br/all/USD-BRL,BTC-BRL,EUR-BRL'
    );

    const type = (currency: ICurrency) => {
      return `\n💲 *${currency.name} (${currency.code})* \nValor atual: R$ ${currency.bid} \nValor mais alto: R$ ${currency.high} \nValor mais baixo: R$ ${currency.low}\n`;
    };

    msg.reply(
      `Cotação atual: 💎💰🤑💹 \n${type(data.USD)} ${type(data.EUR)} ${type(
        data.BTC
      )}`
    );
  }
}
