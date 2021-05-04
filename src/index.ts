import { client } from './services/whatsapp';
import {
  EconomyCommand,
  QuoteCommand,
  CepCommand,
  ProfileCommand,
  SmsCommand,
} from './app/commands';
import { commandDispatcher } from './app/utils/CommandDispatcher';
import type { Message } from 'whatsapp-web.js';

client.on('message', (message: Message) => {
  const economyCommand = new EconomyCommand();
  const quoteCommand = new QuoteCommand();
  const cepCommand = new CepCommand(message.body);
  const profileCommand = new ProfileCommand(message.body);
  const smsCommand = new SmsCommand(message.body);

  commandDispatcher.register('cotacao', economyCommand);
  commandDispatcher.register('mencionar', quoteCommand);
  commandDispatcher.register('cep', cepCommand);
  commandDispatcher.register('perfil', profileCommand);
  commandDispatcher.register('sms', smsCommand);

  if (message.body.startsWith('!')) {
    commandDispatcher.dispatch(message.body.slice(1), message);
  }
});
