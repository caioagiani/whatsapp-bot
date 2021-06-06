import { commandDispatcher } from '../utils/CommandDispatcher';

import EconomyCommand from './EconomyCommand';
import QuoteCommand from './QuoteCommand';
import CepCommand from './CepCommand';
import ProfileCommand from './ProfileCommand';
import SmsCommand from './SmsCommand';

export default async (message) => {
  const economyCommand = new EconomyCommand();
  const quoteCommand = new QuoteCommand();
  const cepCommand = new CepCommand(message.body);
  const profileCommand = new ProfileCommand(message.body);
  const smsCommand = new SmsCommand(message.body);

  await commandDispatcher.register('cotacao', economyCommand);
  await commandDispatcher.register('mencionar', quoteCommand);
  await commandDispatcher.register('cep', cepCommand);
  await commandDispatcher.register('perfil', profileCommand);
  await commandDispatcher.register('sms', smsCommand);

  return commandDispatcher.dispatch(message.body.slice(1), message);
};
