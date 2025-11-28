import { commandDispatcher } from '../utils/CommandDispatcher';
import type { Message } from 'whatsapp-web.js';

// Import all commands
import { EconomyCommand } from './EconomyCommand';
import { QuoteCommand } from './QuoteCommand';
import { CepCommand } from './CepCommand';
import { ProfileCommand } from './ProfileCommand';
import { SmsCommand } from './SmsCommand';

/**
 * Inicializa e registra todos os comandos disponíveis
 */
export const initializeCommands = (): void => {
  // Registrar todos os comandos
  commandDispatcher.register(new EconomyCommand());
  commandDispatcher.register(new QuoteCommand());
  commandDispatcher.register(new CepCommand());
  commandDispatcher.register(new ProfileCommand());
  commandDispatcher.register(new SmsCommand());

  console.log(`✅ ${commandDispatcher.getAllCommands().length} comandos registrados`);
};

// Inicializar comandos imediatamente quando o módulo é carregado
initializeCommands();

/**
 * Handler principal de comandos
 * Processa mensagens que começam com '!' e despacha para o comando apropriado
 */
export const CommandHandler = async (message: Message): Promise<void> => {
  // Ignorar mensagens que não são comandos
  if (!message.body.startsWith('!')) return;

  // Extrair comando e argumentos
  const commandText = message.body.slice(1); // Remove '!'
  const [commandName, ...args] = commandText.split(' ');

  // Despachar para o comando apropriado
  await commandDispatcher.dispatch(commandName.toLowerCase(), message, args);
};
