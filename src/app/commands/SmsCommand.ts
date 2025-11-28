import type { Message } from 'whatsapp-web.js';
import mobizon from '../../services/mobizon';
import { BaseCommand } from '../utils/BaseCommand';

/**
 * Comando para enviar SMS para um usuário mencionado
 */
export class SmsCommand extends BaseCommand {
  name = 'sms';
  description = 'Envia SMS para um usuário mencionado';

  async execute(message: Message, args: string[]): Promise<Message> {
    await this.sendTyping(message);

    // Validar se é grupo
    const groupError = await this.requireGroup(message);
    if (groupError) return groupError;

    // Obter contato mencionado
    const [contact] = await message.getMentions();

    if (!contact) {
      return message.reply(
        '⚠️ Por favor, mencione um usuário.\n\n📖 *Uso:* !sms @usuario',
      );
    }

    try {
      const sendSms = await mobizon.sendSms({
        recipient: contact.number,
        from: '',
        text: 'SMS enviado via WhatsApp BOT.',
      });

      if (sendSms.code !== 0) {
        return message.reply(
          '⚠️ Houve um erro ao enviar o SMS. Tente novamente.',
        );
      }

      return message.reply('✅ SMS enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar SMS:', error);
      return message.reply('⚠️ Não foi possível enviar o SMS.');
    }
  }
}
