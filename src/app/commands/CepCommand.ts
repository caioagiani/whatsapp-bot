import axios from 'axios';
import type { IResponse, IServerData } from '../interfaces/Cep';
import type { Message } from 'whatsapp-web.js';

export default class EconomyCommand {
  cep: string;
  constructor(cep: string) {
    this.cep = cep;
  }

  async execute(msg: Message) {
    const [_, setCep] = this.cep.split(' ');

    const chat = await msg.getChat();

    await chat.sendStateTyping();

    try {
      const { data }: IResponse = await axios.get<IServerData>(
        `https://brasilapi.com.br/api/cep/v1/${setCep}`,
      );

      return msg.reply(
        `*CEP*: ${data.cep}\n*Logradouro*: ${data.street}\n*Cidade*: ${data.city}\n*Bairro*: ${data.neighborhood}\n*UF*: ${data.state}`,
      );
    } catch (error) {
      return msg.reply('CEP não localizado!');
    }
  }
}
