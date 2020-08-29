import axios from "axios";

interface IEconomia {
  getChat: () => any;
  reply: (args: string) => void;
}

interface currency {
  code: string;
  codein: string;
  name: string;
  high: string;
  low: string;
  varBid: string;
  pctChange: string;
  bid: string;
  ask: string;
  timestamp: string;
  create_date: string;
}

export default class EconomyCommand {
  async execute(msg: IEconomia) {
    const chat = await msg.getChat();

    chat.sendStateTyping();

    const { data } = await axios.get(
      "https://economia.awesomeapi.com.br/all/USD-BRL,BTC-BRL,EUR-BRL"
    );

    const type = (currency: currency) => {
      return `\n💲 *${currency.name} (${currency.code})* \nValor atual: R$ ${currency.bid} \nValor mais alto: R$ ${currency.high} \nValor mais baixo: R$ ${currency.low}\n`;
    };

    msg.reply(
      `Cotação atual: 💎💰🤑💹 \n${type(data.USD)} ${type(data.EUR)} ${type(
        data.BTC
      )}`
    );
  }
}
