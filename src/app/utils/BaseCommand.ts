import type { Message, Chat } from 'whatsapp-web.js';
import type { ICommand } from '../interfaces/ICommand';

/**
 * Classe base abstrata para comandos
 * Fornece funcionalidades comuns para todos os comandos
 */
export abstract class BaseCommand implements ICommand {
    abstract name: string;
    abstract description: string;
    aliases?: string[];

    abstract execute(message: Message, args: string[]): Promise<Message | void>;

    /**
     * Envia o estado "digitando..." no chat
     */
    protected async sendTyping(message: Message): Promise<void> {
        const chat = await message.getChat();
        await chat.sendStateTyping();
    }

    /**
     * Verifica se a mensagem foi enviada em um grupo
     */
    protected async isGroup(message: Message): Promise<boolean> {
        const chat = await message.getChat();
        return chat.isGroup;
    }

    /**
     * Obtém o chat da mensagem
     */
    protected async getChat(message: Message): Promise<Chat> {
        return message.getChat();
    }

    /**
     * Valida se o comando está sendo executado em um grupo
     * Retorna mensagem de erro se não estiver
     */
    protected async requireGroup(message: Message): Promise<Message | null> {
        const isGroup = await this.isGroup(message);
        if (!isGroup) {
            return message.reply('⚠️ Este comando só pode ser usado em grupos!');
        }
        return null;
    }

    /**
     * Valida se há argumentos suficientes
     */
    protected validateArgs(
        message: Message,
        args: string[],
        minArgs: number,
        usage: string,
    ): Message | null {
        if (args.length < minArgs) {
            message.reply(`⚠️ Uso incorreto!\n\n📖 *Uso:* ${usage}`);
            return message as any;
        }
        return null;
    }
}
