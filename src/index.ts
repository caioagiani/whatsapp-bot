import { client } from "./server";

import EconomiaController from "./app/controllers/EconomiaController";
import PassagemController from "./app/controllers/PassagemController";
import CompanyController from "./app/controllers/CompanyController";

client.on("message", async (message: any) => {
  switch (message.body) {
    /** Exclusive command for 76Telecom company */
    case "!turno":
      await PassagemController(message);
      break;

    case "!company":
      await CompanyController(message);
      break;

    case "!cotacao":
      await EconomiaController(message);
      break;
  }
});
