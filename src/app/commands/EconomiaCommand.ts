import Command from "./Command";
import HttpClient from "../infrastructure/HttpClient";

interface IEconomia {
  getChat: () => any;
  reply: (args: string) => void;
}

export interface USD {
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

export interface BTC {
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

export interface EUR {
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

export interface EconomiaResponse {
  USD: USD;
  BTC: BTC;
  EUR: EUR;
}

export default class EconomiaCommand extends Command<IEconomia> {
  constructor(private readonly httpClient: HttpClient) {
    super();
  }

  async execute(msg) {
    const chat = await msg.getChat();
    chat.sendStateTyping();

    const url =
      "https://economia.awesomeapi.com.br/all/USD-BRL,BTC-BRL,EUR-BRL";

    const type = (currency: {
      name?: string;
      code?: string;
      bid?: string;
      high?: string;
      low?: string;
      USD?: string;
      BTC?: string;
      EUR?: string;
    }) => {
      return `\n💲 *${currency.name} (${currency.code})* \nValor atual: R$ ${currency.bid} \nValor mais alto: R$ ${currency.high} \nValor mais baixo: R$ ${currency.low}\n`;
    };

    const response = await this.httpClient.get<EconomiaResponse>(url);

    if (response.statusCode !== 200) {
      msg.reply("Houve um erro inesperado.");
      return;
    }

    const { USD, BTC, EUR } = response.body;

    msg.reply(
      `Cotação atual: 💎💰🤑💹 \n${type(USD)} ${type(EUR)} ${type(BTC)}`,
    );
  }
}
