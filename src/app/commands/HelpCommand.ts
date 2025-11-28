import type { Message } from 'whatsapp-web.js';
import { BaseCommand } from '../utils/BaseCommand';
import { commandDispatcher } from '../utils/CommandDispatcher';

/**
 * Command to display all available commands with their descriptions and aliases
 */
export class HelpCommand extends BaseCommand {
    name = 'help';
    description = 'Shows all available commands with their descriptions';
    aliases = ['ajuda', 'comandos', 'commands'];

    async execute(message: Message, args: string[]): Promise<Message> {
        await this.sendTyping(message);

        const commands = commandDispatcher.getAllCommands();

        // Build help message
        let helpMessage = '📚 *Available Commands*\n\n';
        helpMessage += '━━━━━━━━━━━━━━━━━━━━\n\n';

        commands.forEach((command) => {
            // Command name and description
            helpMessage += `🔹 *!${command.name}*\n`;
            helpMessage += `   ${command.description}\n`;

            // Show aliases if available
            if (command.aliases && command.aliases.length > 0) {
                const aliasesList = command.aliases.map((alias) => `!${alias}`).join(', ');
                helpMessage += `   _Aliases:_ ${aliasesList}\n`;
            }

            helpMessage += '\n';
        });

        helpMessage += '━━━━━━━━━━━━━━━━━━━━\n\n';
        helpMessage += '💡 *Tip:* All commands start with `!`\n';
        helpMessage += '📖 For more info, visit: https://github.com/caioagiani/whatsapp-bot';

        return message.reply(helpMessage);
    }
}
