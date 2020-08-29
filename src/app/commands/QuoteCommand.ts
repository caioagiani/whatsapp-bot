import { client } from "../../server";
import { company } from "../../config/integrantes.json";

interface ICompany {
  id: { participant: any };
  getChat: () => any;
  getContact: () => any;
  reply: (arg0: string) => void;
}

export default class QuoteCommand {
  async execute(msg: ICompany) {
    const chat = await msg.getChat();
    const user = await msg.getContact();
    const contato = user.id.user;

    chat.sendStateTyping();

    if (!chat.isGroup) {
      return msg.reply("Comando apenas para grupos!");
    }

    company.map(async (valores) => {
      if (valores.numero == contato) {
        if (!valores.admin) {
          return msg.reply(
            "Ops, você não tem permissão para executar este comando!"
          );
        }

        let text = "";
        let mentions = [];

        for (let participant of chat.participants) {
          const contact = await client.getContactById(
            participant.id._serialized
          );

          mentions.push(contact);
          text += `@${participant.id.user} `;
        }

        chat.sendMessage(text, { mentions });
      }
    });
  }
}
