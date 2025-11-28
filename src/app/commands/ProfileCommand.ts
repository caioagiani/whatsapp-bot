import { client, MessageMedia } from '../../services/whatsapp';
import { encode } from 'node-base64-image';
import type { Message } from 'whatsapp-web.js';
import { BaseCommand } from '../utils/BaseCommand';

/**
 * Comando para visualizar foto de perfil de um usuário
 */
export class ProfileCommand extends BaseCommand {
  name = 'perfil';
  description = 'Mostra a foto de perfil de um usuário mencionado';
  aliases = ['foto', 'avatar', 'pic'];

  async execute(message: Message, args: string[]): Promise<Message> {
    await this.sendTyping(message);

    // Validar se é grupo
    const groupError = await this.requireGroup(message);
    if (groupError) return groupError;

    // Obter contato mencionado
    const [contact] = await message.getMentions();

    if (!contact) {
      return message.reply(
        '⚠️ Por favor, mencione um usuário.\n\n📖 *Uso:* !perfil @usuario',
      );
    }

    await message.reply('🔍 Buscando foto de perfil...');

    try {
      const uri = await client.getProfilePicUrl(contact.number);

      if (!uri) {
        return message.reply('⚠️ Este usuário não possui foto de perfil.');
      }

      const imageProfile = await encode(uri, { string: true });

      if (typeof imageProfile === 'string') {
        const media = new MessageMedia(
          'image/png',
          imageProfile,
          `${contact.number}.png`,
        );

        return client.sendMessage(message.from, media);
      }

      return message.reply('⚠️ Erro ao processar a imagem.');
    } catch (error) {
      console.error('Erro ao buscar foto de perfil:', error);
      return message.reply('⚠️ Não foi possível obter a foto de perfil.');
    }
  }
}
