import * as request from "request";

export default async (msg: { reply: (args: string) => void }) => {
  const options = {
    method: "GET",
    url: "https://economia.awesomeapi.com.br/all/USD-BRL,BTC-BRL,EUR-BRL",
  };

  const type = (currency: {
    name?: any;
    code?: any;
    bid?: any;
    high?: any;
    low?: any;
    USD?: any;
    BTC?: any;
    EUR?: any;
  }) => {
    return `\n💲 *${currency.name} (${currency.code})* \nValor atual: R$ ${currency.bid} \nValor mais alto: R$ ${currency.high} \nValor mais baixo: R$ ${currency.low}\n`;
  };

  request(options, async (error: any, response: any, body: any) => {
    const { USD, BTC, EUR } = JSON.parse(body);

    msg.reply(
      `Cotação atual: 💎💰🤑💹 \n${type(USD)} ${type(EUR)} ${type(BTC)}`
    );
  });
};
