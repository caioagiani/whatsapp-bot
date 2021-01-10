import { client } from './server';
import {
  EconomyCommand,
  QuoteCommand,
  CepCommand,
  ProfileCommand,
} from './app/commands';
import CommandDispatcher from './app/utils/CommandDispatcher';
import type { Message } from 'whatsapp-web.js';

const dispatcher = new CommandDispatcher();

client.on('message', async (message: Message) => {
  dispatcher.register('cotacao', new EconomyCommand());
  dispatcher.register('mencionar', new QuoteCommand());
  dispatcher.register('cep', new CepCommand(message.body));
  dispatcher.register('perfil', new ProfileCommand(message.body));

  if (message.body.startsWith('!')) {
    dispatcher.dispatch(message.body.slice(1), message);
  }
});
