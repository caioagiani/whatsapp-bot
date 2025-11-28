import axios from 'axios';
import type { IResponse, IServerData } from '../interfaces/Cep';
import type { Message } from 'whatsapp-web.js';
import { BaseCommand } from '../utils/BaseCommand';

/**
 * Comando para consultar informações de CEP
 */
export class CepCommand extends BaseCommand {
  name = 'cep';
  description = 'Busca informações de um CEP brasileiro';

  async execute(message: Message, args: string[]): Promise<Message> {
    await this.sendTyping(message);

    // Validar argumentos
    if (args.length === 0) {
      return message.reply(
        '⚠️ Por favor, informe um CEP.\n\n📖 *Uso:* !cep 01310-100',
      );
    }

    const cep = args[0].replace(/\D/g, ''); // Remove caracteres não numéricos

    if (cep.length !== 8) {
      return message.reply('⚠️ CEP inválido! O CEP deve ter 8 dígitos.');
    }

    try {
      const { data }: IResponse = await axios.get<IServerData>(
        `https://brasilapi.com.br/api/cep/v1/${cep}`,
      );

      return message.reply(
        `📮 *Informações do CEP*\n\n` +
        `*CEP:* ${data.cep}\n` +
        `*Logradouro:* ${data.street}\n` +
        `*Bairro:* ${data.neighborhood}\n` +
        `*Cidade:* ${data.city}\n` +
        `*UF:* ${data.state}`,
      );
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      return message.reply('⚠️ CEP não localizado ou serviço indisponível.');
    }
  }
}
