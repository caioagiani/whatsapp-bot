import { client } from "./server";
import CompanyRepository from "./app/repositories/CompanyRepository";
import HttpClient from "./app/infrastructure/HttpClient";
import CommandDispatcher from "./app/commands/CommandDispatcher";
import {
  PassagemCommand,
  EconomiaCommand,
  CompanyCommand,
  GlobalCommand,
  PausaCommand,
  EncerraCommand,
  ZabbixCommand,
} from "./app/commands";

const httpClient = new HttpClient();
const companyRepository = new CompanyRepository();

const dispatcher = new CommandDispatcher();

dispatcher.register("company", new CompanyCommand());
dispatcher.register("cotacao", new EconomiaCommand(httpClient));
dispatcher.register("encerrar", new EncerraCommand(companyRepository));
dispatcher.register("important", new GlobalCommand(companyRepository));
dispatcher.register("pausa", new PausaCommand(companyRepository));
dispatcher.register("turno", new PassagemCommand(httpClient));
dispatcher.register("zabbix", new ZabbixCommand());

client.on("message", async (message: any) => {
  if (!message.body.startsWith("!")) {
    return;
  }

  dispatcher.dispatch(message.body.slice(1), message);
});
