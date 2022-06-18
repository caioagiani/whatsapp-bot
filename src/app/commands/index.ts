import { commandDispatcher } from '../utils/CommandDispatcher';
import { Message } from 'whatsapp-web.js';
import { EconomyCommand } from './EconomyCommand';
import { QuoteCommand } from './QuoteCommand';
import CepCommand from './CepCommand';
import ProfileCommand from './ProfileCommand';
import SmsCommand from './SmsCommand';

export const CommandHandler = async (message: Message): Promise<void> => {
  if (!message.body.startsWith('!')) return;

  await commandDispatcher.register('cotacao', EconomyCommand);
  await commandDispatcher.register('mencionar', QuoteCommand);
  await commandDispatcher.register('cep', new CepCommand(message.body));
  await commandDispatcher.register('perfil', new ProfileCommand(message.body));
  await commandDispatcher.register('sms', new SmsCommand(message.body));

  return commandDispatcher.dispatch(message.body.slice(1), message);
};
