import { client, MessageMedia } from '../../services/whatsapp';
import { encode } from 'node-base64-image';
import type { Message } from 'whatsapp-web.js';
import { BaseCommand } from '../utils/BaseCommand';

/**
 * Command to view a user's profile picture
 */
export class ProfileCommand extends BaseCommand {
  name = 'perfil';
  description = 'Shows the profile picture of a mentioned user';
  aliases = ['foto', 'avatar', 'pic'];

  async execute(message: Message, args: string[]): Promise<Message> {
    await this.sendTyping(message);

    // Validate if it's a group
    const groupError = await this.requireGroup(message);
    if (groupError) return groupError;

    // Get mentioned contact
    const [contact] = await message.getMentions();

    if (!contact) {
      return message.reply(
        '⚠️ Please mention a user.\n\n📖 *Usage:* !perfil @user',
      );
    }

    await message.reply('🔍 Searching for profile picture...');

    try {
      const uri = await client.getProfilePicUrl(contact.number);

      if (!uri) {
        return message.reply('⚠️ This user does not have a profile picture.');
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

      return message.reply('⚠️ Error processing the image.');
    } catch (error) {
      console.error('Error fetching profile picture:', error);
      return message.reply('⚠️ Unable to get the profile picture.');
    }
  }
}
