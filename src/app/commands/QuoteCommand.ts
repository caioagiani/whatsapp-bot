import { client } from '../../services/whatsapp';
import { company } from '../../config/integrantes.json';
import type { Message, GroupChat } from 'whatsapp-web.js';
import { BaseCommand } from '../utils/BaseCommand';

/**
 * Comando para mencionar todos os membros de um grupo
 */
export class QuoteCommand extends BaseCommand {
  name = 'mencionar';
  description = 'Menciona todos os membros do grupo (apenas admins)';
  aliases = ['everyone', 'all', 'todos'];

  async execute(message: Message, args: string[]): Promise<Message | void> {
    await this.sendTyping(message);

    // Validar se é grupo
    const groupError = await this.requireGroup(message);
    if (groupError) return groupError;

    const chat: Partial<GroupChat> = await message.getChat();
    const {
      id: { user: contato },
    } = await message.getContact();

    // Verificar permissões
    const allowPermissions = company.filter(
      ({ numero, admin }) => numero === contato && admin,
    );

    if (!allowPermissions.length) {
      return message.reply('⚠️ Você não tem permissão para usar este comando!');
    }

    // Mencionar todos os participantes
    const mentions = [];

    for (const participant of chat.participants) {
      const contact = await client.getContactById(participant.id._serialized);
      mentions.push(contact);
    }

    const names = mentions.map((mention) => `@${mention.number}`).join(' ');

    return chat.sendMessage(names, { mentions });
  }
}

