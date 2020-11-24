import { client } from '../../server';
import { company } from '../../config/integrantes.json';
import { IMessage } from '../interfaces/Message';

export default class QuoteCommand {
  async execute(msg: IMessage) {
    const chat = await msg.getChat();
    const user = await msg.getContact();

    const { user: contato } = user.id;

    chat.sendStateTyping();

    if (!chat.isGroup) {
      return msg.reply('Comando apenas para grupos!');
    }

    company.map(async (valores) => {
      if (valores.numero == contato) {
        if (!valores.admin) {
          return msg.reply(
            'Ops, você não tem permissão para executar este comando!'
          );
        }

        let text = '';
        const mentions = [];

        for (const participant of chat.participants) {
          const contact = await client.getContactById(
            participant.id._serialized
          );

          mentions.push(contact);
          text += `@${participant.id.user} `;
        }

        chat.sendMessage(text, { mentions });
      }
    });
  }
}
