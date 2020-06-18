import { client, MessageMedia } from "../../server";
import Command from "./Command";
import CompanyRepository from "../repositories/CompanyRepository";

interface ICompany {
  id: { participant: any };
  getChat: () => any;
  getContact: () => any;
  reply: (arg0: string) => void;
}

export default class GlobalCommand extends Command<ICompany> {
  constructor(private readonly companyRepository: CompanyRepository) {
    super();
  }
  async execute(msg: ICompany) {
    const chat = await msg.getChat();
    const user = await msg.getContact();
    const contato = user.id.user;

    chat.sendStateTyping();

    if (!chat.isGroup) return;

    const companies = await this.companyRepository.findByPhoneNumber(contato);

    interface IMessage {
      text: string;
      mentions: any[];
    }

    companies.forEach(async (valores) => {
      if (!valores.admin) {
        msg.reply("Ops, você não tem permissão para executar este comando!");
        return;
      }

      const { text, mentions } = chat.participants.reduce(
        async (message: IMessage, participant) => {
          const contact = await client.getContactById(
            participant.id._serialized,
          );
          message.mentions.push(contact);
          return {
            text: message.text + `@${participant.id.user} `,
            mentions: message.mentions,
          };
        },
        { text: "", mentions: [] },
      );

      chat.sendMessage(text, { mentions });
    });
  }
}
