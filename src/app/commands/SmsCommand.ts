import type { Message } from 'whatsapp-web.js';
import mobizon from '../../services/mobizon';
import { BaseCommand } from '../utils/BaseCommand';

/**
 * Command to send SMS to a mentioned user
 */
export class SmsCommand extends BaseCommand {
  name = 'sms';
  description = 'Sends SMS to a mentioned user';

  async execute(message: Message, args: string[]): Promise<Message> {
    await this.sendTyping(message);

    // Validate if it's a group
    const groupError = await this.requireGroup(message);
    if (groupError) return groupError;

    // Get mentioned contact
    const [contact] = await message.getMentions();

    if (!contact) {
      return message.reply(
        '⚠️ Please mention a user.\n\n📖 *Usage:* !sms @user',
      );
    }

    try {
      const sendSms = await mobizon.sendSms({
        recipient: contact.number,
        from: '',
        text: 'SMS sent via WhatsApp BOT.',
      });

      if (sendSms.code !== 0) {
        return message.reply(
          '⚠️ There was an error sending the SMS. Please try again.',
        );
      }

      return message.reply('✅ SMS sent successfully!');
    } catch (error) {
      console.error('Error sending SMS:', error);
      return message.reply('⚠️ Unable to send SMS.');
    }
  }
}
