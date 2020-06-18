import CompanyRepository from "../repositories/CompanyRepository";
import Command from "./Command";

interface ICompany {
  getChat: () => any;
  getContact: () => any;
  reply: (args: string) => void;
  from: string;
}

export default class EncerraCommand extends Command<ICompany> {
  constructor(private readonly companyRepository: CompanyRepository) {
    super();
  }

  async execute(msg: ICompany) {
    const chat = await msg.getChat();
    const user = await msg.getContact();
    const contato = user.id.user;

    chat.sendStateTyping();

    const date = new Date(Date.now());

    const companies = await this.companyRepository.findByPhoneNumber(contato);

    companies.forEach((valores) => {
      if (date.getHours() < valores.fim) {
        msg.reply(`🤖: Hey *${valores.nome}*, seu turno ainda não acabou!!!`);
        return;
      }

      msg.reply(`🤖: Bom descanso *${valores.nome}*!`);
    });
  }
}
