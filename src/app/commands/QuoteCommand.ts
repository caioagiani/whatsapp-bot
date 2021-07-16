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

    company.forEach(async ({ numero, admin }): Promise<Message> => {
      if (numero !== contato) return;

      if (!admin) {
        return msg.reply(
          'Ops, você não tem permissão para executar este comando!',
        );
      }

      let text = '';
      const mentions = [];

      for (const participant of chat.participants) {
        const contact = await client.getContactById(participant.id._serialized);

        mentions.push(contact);
        text += `@${participant.id.user} `;
      }

      return chat.sendMessage(text, { mentions });
    });
  },
};
