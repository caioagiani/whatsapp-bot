import { client } from "./server";

import {
  NoticiasController,
  PrevencaoController,
  AtendimentosController,
  BeneficiosController,
} from "./app/controllers";

client.on("message", async (message: any) => {
  switch (message.body) {
    case "1 - Noticias":
      await NoticiasController(message);
      break;

    case "2 - Atendimentos":
      await AtendimentosController(message);
      break;

    case "3 - Prevenção":
      await PrevencaoController(message);
      break;

    case "4 - Benefícios":
      await BeneficiosController(message);
      break;

      
  }
});
