import type { ICommand } from '../interfaces/ICommand';
import type { Message } from 'whatsapp-web.js';

/**
 * Dispatcher responsável por gerenciar e executar comandos
 */
class CommandDispatcher {
  private commands: Map<string, ICommand> = new Map();
  private aliases: Map<string, string> = new Map();

  /**
   * Registra um comando no dispatcher
   * @param command - Instância do comando a ser registrado
   */
  register(command: ICommand): void {
    this.commands.set(command.name, command);

    // Registrar aliases se existirem
    if (command.aliases && command.aliases.length > 0) {
      command.aliases.forEach((alias) => {
        this.aliases.set(alias, command.name);
      });
    }
  }

  /**
   * Despacha um comando para execução
   * @param commandName - Nome do comando (ou alias)
   * @param message - Mensagem do WhatsApp
   * @param args - Argumentos do comando
   */
  async dispatch(
    commandName: string,
    message: Message,
    args: string[],
  ): Promise<void> {
    // Resolver alias para nome real do comando
    const resolvedName = this.aliases.get(commandName) || commandName;
    const command = this.commands.get(resolvedName);

    if (command) {
      try {
        await command.execute(message, args);
      } catch (error) {
        console.error(`❌ Erro ao executar comando '${resolvedName}':`, error);
        await message.reply(
          '⚠️ Ocorreu um erro ao executar o comando. Tente novamente mais tarde.',
        );
      }
    }
    // Se comando não existe, não faz nada (silencioso)
  }

  /**
   * Obtém um comando pelo nome ou alias
   */
  getCommand(name: string): ICommand | undefined {
    const resolvedName = this.aliases.get(name) || name;
    return this.commands.get(resolvedName);
  }

  /**
   * Retorna todos os comandos registrados
   */
  getAllCommands(): ICommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Verifica se um comando existe
   */
  hasCommand(name: string): boolean {
    const resolvedName = this.aliases.get(name) || name;
    return this.commands.has(resolvedName);
  }
}

export const commandDispatcher = new CommandDispatcher();

