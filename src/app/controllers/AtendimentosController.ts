interface IAtendimentos {
  getChat: () => any;
  reply: (args: string) => void;
  from: string;
}

export default async (msg: IAtendimentos) => {
  const chat = await msg.getChat();

  chat.sendStateTyping();

  msg.reply(
    `🤖:1. Clinica geral
    2. Cardiologia
    3. Saúde da Mulher
    4. Psicologia
    5. Nutrição
    6. Fisioterapia 
    7. Fonoaudiologia
    8. Odontologia
    9. Outros`
  );
};
