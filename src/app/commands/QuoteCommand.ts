import { client } from '../../services/whatsapp';
import { company } from '../../config/integrantes.json';
import type { Message, GroupChat } from 'whatsapp-web.js';
import { BaseCommand } from '../utils/BaseCommand';

/**
 * Command to mention all group members
 */
export class QuoteCommand extends BaseCommand {
  name = 'mencionar';
  description = 'Mentions all group members (admins only)';
  aliases = ['everyone', 'all', 'todos'];

  async execute(message: Message, args: string[]): Promise<Message | void> {
    await this.sendTyping(message);

    // Validate if it's a group
    const groupError = await this.requireGroup(message);
    if (groupError) return groupError;

    const chat: Partial<GroupChat> = await message.getChat();
    const {
      id: { user: contato },
    } = await message.getContact();

    // Check permissions
    const allowPermissions = company.filter(
      ({ numero, admin }) => numero === contato && admin,
    );

    if (!allowPermissions.length) {
      return message.reply('⚠️ You do not have permission to use this command!');
    }

    // Mention all participants
    const mentions = [];

    for (const participant of chat.participants) {
      const contact = await client.getContactById(participant.id._serialized);
      mentions.push(contact);
    }

    const names = mentions.map((mention) => `@${mention.number}`).join(' ');

    return chat.sendMessage(names, { mentions });
  }
}

