import { company } from "../../config/integrantes.json";

interface ICompany {
  getChat: () => any;
  getContact: () => any;
  reply: (args: string) => void;
  from: string;
}

export default async (msg: ICompany) => {
  const chat = await msg.getChat();
  const user = await msg.getContact();
  const contato = user.id.user;

  chat.sendStateTyping();

  const date = new Date(Date.now());

  company.map((valores) => {
    if (valores.numero == contato) {
      if (date.getHours() < valores.fim) {
        msg.reply(`Hey *${valores.nome}*, seu turno ainda não acabou!!!`);
      } else {
        msg.reply(`Bom descanso *${valores.nome}*, amanhã tem mais!!!`);
      }
    }
  });
};
