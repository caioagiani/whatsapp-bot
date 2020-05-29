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

  if (contato == "5511987780238")
    return msg.reply("*Papai* você não tira pausa, vai trabalhar!!!");

  const date = new Date(Date.now());

  company.map((valores) => {
    date.setMinutes(date.getMinutes() + valores.pausa);

    let retorno = `${date.getHours()}:${date.getMinutes()}`;

    if (valores.numero == contato) {
      msg.reply(
        `Boa pausa *${valores.nome}*, não se esqueça de voltar às *${retorno}h* ok?!!`
      );
    }
  });
};
