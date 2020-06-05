import { client } from "./server";

import {
  PassagemController,
  EconomiaController,
  CompanyController,
  GlobalController,
  PausaController,
  EncerraController,
  ZabbixController,
} from "./app/controllers";

client.on("message", async (message: any) => {
  switch (message.body) {
    case "!turno":
      await PassagemController(message);
      break;

    case "!company":
      await CompanyController(message);
      break;

    case "!cotacao":
      await EconomiaController(message);
      break;

    case "!important":
      await GlobalController(message);
      break;

    case "!pausa":
      await PausaController(message);
      break;

    case "!encerrar":
      await EncerraController(message);
      break;
      
    case "!zabbix":
      await ZabbixController(message);
      break;
  }
});
