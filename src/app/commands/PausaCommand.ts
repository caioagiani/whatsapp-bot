import Command from "./Command";
import CompanyRepository from "./../repositories/CompanyRepository";

interface ICompany {
  getChat: () => any;
  getContact: () => any;
  reply: (args: string) => void;
  from: string;
}

export default class PausaCommand extends Command<ICompany> {
  constructor(private readonly companyRepository: CompanyRepository) {
    super();
  }

  async execute(msg: ICompany) {
    const chat = await msg.getChat();
    const user = await msg.getContact();
    const contato = user.id.user;

    chat.sendStateTyping();

    // CUIDADO AO COLOCAR NUMERO EM PROJETO ABERTO
    if (contato == "5511987780238") {
      msg.reply("🤖: *Papai* você não tira pausa, vai trabalhar!!!");
      return;
    }

    const date = new Date(Date.now());

    const companies = await this.companyRepository.findByPhoneNumber(contato);

    companies.forEach((valores) => {
      date.setMinutes(date.getMinutes() + valores.pausa);
      const retorno = `${date.getHours()}:${date.getMinutes()}`;

      msg.reply(
        `🤖: Boa pausa *${valores.nome}*, não se esqueça de voltar às *${retorno}h* ok?!!`,
      );
    });
  }
}
