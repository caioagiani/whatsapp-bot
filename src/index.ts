import { client } from './services/whatsapp';
import type { Message } from 'whatsapp-web.js';
import dispatchCommand from './app/commands';

client.on('message', (message: Message) => {
  if (message.body.startsWith('!')) return dispatchCommand(message);
});
