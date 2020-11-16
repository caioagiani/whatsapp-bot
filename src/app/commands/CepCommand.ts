import axios from 'axios';
import { IMessage } from '../interfaces/Message';

interface IResponse {
  data: IServerData;
}

interface IServerData {
  cep: string;
  logradouro: string;
  bairro: string;
  uf: string;
}

export default class EconomyCommand {
  cep: string;
  constructor(cep: string) {
    this.cep = cep;
  }

  async execute(msg: IMessage) {
    const [_, setCep] = this.cep.split(' ');

    const chat = await msg.getChat();

    chat.sendStateTyping();

    try {
      const { data }: IResponse = await axios.get<IServerData>(
        `https://viacep.com.br/ws/${setCep}/json/unicode/`
      );

      return msg.reply(
        `*CEP*: ${data.cep}\n*Logradouro*: ${data.logradouro}\n*Bairro*: ${data.bairro}\n*UF*: ${data.uf}`
      );
    } catch (error) {
      return msg.reply(`CEP não localizado!`);
    }
  }
}
