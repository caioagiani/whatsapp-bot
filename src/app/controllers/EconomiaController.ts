import * as request from "request";

export default async (msg: {
  getChat: () => any;
  reply: (args: string) => void;
}) => {
  const chat = await msg.getChat();
  chat.sendStateTyping();

  const options: { method: string; url: string } = {
    method: "GET",
    url: "https://economia.awesomeapi.com.br/all/USD-BRL,BTC-BRL,EUR-BRL",
  };

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

  request(options, async (error: any, response: any, body: any) => {
    if (error ?? response.statusCode !== 200)
      return msg.reply("Houve um erro inesperado.");

    const { USD, BTC, EUR } = JSON.parse(body);

    msg.reply(
      `Cotação atual: 💎💰🤑💹 \n${type(USD)} ${type(EUR)} ${type(BTC)}`
    );
  });
};
