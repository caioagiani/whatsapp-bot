import { client, MessageMedia } from '../../server';
import { encode } from 'node-base64-image';
import type { Message } from 'whatsapp-web.js';

export default class ProfileCommand {
  mention: string;
  constructor(mention: string) {
    this.mention = mention;
  }

  async execute(msg: Message) {
    const chat = await msg.getChat();

    const [contact] = await msg.getMentions();

    chat.sendStateTyping();

    if (!chat.isGroup) {
      return msg.reply('Comando apenas para grupos!');
    }

    msg.reply('Stalkeando este contato...');

    if (!contact) return msg.reply('Contato não localizado.');

    const url_i = await client.getProfilePicUrl(contact.number);

    if (!url_i) return msg.reply('Imagem não foi localizada.');

    const image: any = await encode(url_i, { string: true });

    const media = new MessageMedia('image/png', image, `${contact.number}.png`);

    client.sendMessage(msg.from, media);
  }
}
