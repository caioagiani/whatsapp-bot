import { client, MessageMedia } from '../../services/whatsapp';
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

    await chat.sendStateTyping();

    if (!chat.isGroup) {
      return msg.reply('Comando apenas para grupos!');
    }

    if (!contact) return msg.reply('Contato não localizado.');

    await msg.reply('Stalkeando este contato...');

    const url_i = await client.getProfilePicUrl(contact.number);

    if (!url_i) return msg.reply('Imagem não foi localizada.');

    const imageProfile = await encode(url_i, { string: true });

    if (typeof imageProfile === 'string') {
      const media = new MessageMedia(
        'image/png',
        imageProfile,
        `${contact.number}.png`,
      );

      return client.sendMessage(msg.from, media);
    }

    return msg.reply('Erro inesperado');
  }
}
