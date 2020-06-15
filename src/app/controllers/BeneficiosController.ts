

interface IBeneficios {
  getChat: () => any;
  reply: (args: string) => void;
  from: string;
}

export default async (msg: IBeneficios) => {
  const chat = await msg.getChat();

  chat.sendStateTyping();

  msg.reply(
    `A cada consulta/exame realizado pelo caminhoneiro, os dependentes do mesmo recebem 100 pontos para trocá-los em descontos em exames/consultas!`
  );

};
