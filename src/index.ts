import { client } from './services/whatsapp';
import { CommandHandler } from './app/commands';

client.on('message_create', CommandHandler);
