import axios from 'axios';
import type { Message } from 'whatsapp-web.js';

export const EconomyCommand = {
  async execute(msg: Message): Promise<Message> {
    const chat = await msg.getChat();

    await chat.sendStateTyping();

    const { data } = await axios.get(
      'https://economia.awesomeapi.com.br/all/USD-BRL,BTC-BRL,EUR-BRL',
    );

    const getAllCurrencies = () => {
      return Object.keys(data).map((key) => {
        return `\n💲 *${data[key].name} (${data[key].code})* \nValor atual: R$ ${data[key].bid} \nValor mais alto: R$ ${data[key].high} \nValor mais baixo: R$ ${data[key].low}\n`;
      });
    };

    return msg.reply(`Cotação atual: 💎💰🤑💹 \n${getAllCurrencies()}`);
  },
};
