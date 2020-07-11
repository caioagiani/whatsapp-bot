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
      date.setMinutes(date.getMinutes() + valores.pausa);

      let retorno = `${date.getHours()}:${date.getMinutes()}`;

      msg.reply(
        `🤖: Boa pausa *${valores.nome}*, não se esqueça de voltar às *${retorno}h* ok?!!`
      );
    }
  });
};
