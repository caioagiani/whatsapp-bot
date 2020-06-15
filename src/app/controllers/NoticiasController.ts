

interface INoticias {
  getChat: () => any;
  reply: (args: string) => void;
  from: string;
}

export default async (msg: INoticias) => {
  const chat = await msg.getChat();

  chat.sendStateTyping();

  msg.reply(
    `🤖: 1 - Inovação em saúde dos caminhoneiros começa pelo Hackaton da CCR.
    Mais de 7.000 inscritos participaram de 12 a 14 de junho do maior evento online de saúde dos caminhoneiros.
    \n\n2 - ANTT publica regras e metodologia para cobrança de frete de cargas.
    Valores de lucro, pedágio, despesas de administração, tributos e taxas não integrarão o cálculo; em julho, tabela gerou insatisfação e ameaça de greve.    
    \n\n3 - Os setores que amargam os sintomas da Covid-19 — e o que os salvarão.
    Empresas de transporte e logística sentiram de frente o baque do coronavírus e apelam ao Governo Federal pela manutenção dos negócios`
  );

};
