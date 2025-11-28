import { commandDispatcher } from '../utils/CommandDispatcher';
import type { Message } from 'whatsapp-web.js';

// Import all commands
import { EconomyCommand } from './EconomyCommand';
import { QuoteCommand } from './QuoteCommand';
import { CepCommand } from './CepCommand';
import { ProfileCommand } from './ProfileCommand';
import { SmsCommand } from './SmsCommand';
import { HelpCommand } from './HelpCommand';

/**
 * Initializes and registers all available commands
 */
export const initializeCommands = (): void => {
  // Register all commands
  commandDispatcher.register(new HelpCommand());
  commandDispatcher.register(new EconomyCommand());
  commandDispatcher.register(new QuoteCommand());
  commandDispatcher.register(new CepCommand());
  commandDispatcher.register(new ProfileCommand());
  commandDispatcher.register(new SmsCommand());

  console.log(`✅ ${commandDispatcher.getAllCommands().length} commands registered`);
};

// Initialize commands immediately when the module is loaded
initializeCommands();

/**
 * Main command handler
 * Processes messages starting with '!' and dispatches to the appropriate command
 */
export const CommandHandler = async (message: Message): Promise<void> => {
  // Ignore messages that are not commands
  if (!message.body.startsWith('!')) return;

  // Extract command and arguments
  const commandText = message.body.slice(1); // Remove '!'
  const [commandName, ...args] = commandText.split(' ');

  // Dispatch to the appropriate command
  await commandDispatcher.dispatch(commandName.toLowerCase(), message, args);
};
