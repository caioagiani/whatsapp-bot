import type { Message } from 'whatsapp-web.js';
import mobizon from '../../services/mobizon';

export default class ProfileCommand {
  mention: string;
  constructor(mention: string) {
    this.mention = mention;
  }

  async execute(msg: Message) {
    const chat = await msg.getChat();

    const [contact] = await msg.getMentions();

    await chat.sendStateTyping();

    if (!chat.isGroup) {
      return msg.reply('Comando apenas para grupos!');
    }

    if (!contact) return msg.reply('Contato não localizado.');

    const sendSms = await mobizon.sendSms({
      recipient: contact.number,
      from: '',
      text: 'Sms enviado via BOT.',
    });

    if (sendSms.code !== 0) {
      return msg.reply('Oops, houve um erro ao enviar SMS, tente novamente.');
    }

    return msg.reply('SMS enviado com sucesso!');
  }
}
