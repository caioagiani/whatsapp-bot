import type { Message } from 'whatsapp-web.js';

/**
 * Interface base para todos os comandos do bot
 */
export interface ICommand {
    /**
     * Nome do comando (sem o prefixo !)
     * Exemplo: 'cotacao', 'cep', 'perfil'
     */
    name: string;

    /**
     * Descrição do comando para exibição no help
     */
    description: string;

    /**
     * Aliases alternativos para o comando
     * Exemplo: ['moeda', 'dolar'] para o comando 'cotacao'
     */
    aliases?: string[];

    /**
     * Executa o comando
     * @param message - Mensagem do WhatsApp que disparou o comando
     * @param args - Argumentos passados após o nome do comando
     * @returns Promise que resolve quando o comando terminar
     */
    execute(message: Message, args: string[]): Promise<Message | void>;
}
