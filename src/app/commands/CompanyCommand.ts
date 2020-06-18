import Command from "./Command";

interface ICompany {
  getChat: () => any;
  reply: (args: string) => void;
  from: string;
}

export default class CompanyCommand extends Command<ICompany> {
  async execute(message) {
    const chat = await message.getChat();
    chat.sendStateTyping();
    message.reply(
      `🤖: Desde o início em 1998, a *76 Telecom* nunca parou de inovar. Iniciamos nossas atividades na cidade de Mogi das Cruzes desenvolvendo soluções sob medida em Telefonia Fixa, Internet, Data center e Software.
      \n\nHoje expandimos nosso negócio para todo o país sem perder a qualidade no atendimento, um dos diferenciais da 76 Telecom. Afinal, quanto mais próximos estamos de nossos parceiros, mais entendemos de seu negócio e melhores são as soluções oferecidas.
      \n\nA 76 Telecom possui as licenças SCM (Serviço de comunicação Multimídia) e STFC (Serviço Telefônico Fixo Comutado) da ANATEL. Conte com a nossa tecnologia de última geração para ligar sua empresa ao mundo.
      \n\n76 Telecom. O número da inovação.`,
    );
  }
}
