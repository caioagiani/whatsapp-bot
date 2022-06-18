import { client } from '../../services/whatsapp';
import { company } from '../../config/integrantes.json';
import type { Message, GroupChat } from 'whatsapp-web.js';

export const QuoteCommand = {
  async execute(msg: Message): Promise<Message> {
    const chat: Partial<GroupChat> = await msg.getChat();
    const {
      id: { user: contato },
    } = await msg.getContact();

    await chat.sendStateTyping();

    if (!chat.isGroup) {
      return msg.reply('Comando apenas para grupos!');
    }

    const allowPermissions = company.filter(
      ({ numero, admin }) => numero === contato && admin,
    );

    if (!allowPermissions.length) {
      return msg.reply('Você não tem permissão para usar este comando!');
    }

    const mentions = [];

    for (const participant of chat.participants) {
      const contact = await client.getContactById(participant.id._serialized);

      mentions.push(contact);
    }

    const names = mentions.map((mention) => `@${mention.number}`).join(' ');

    return chat.sendMessage(names, { mentions });
  },
};
