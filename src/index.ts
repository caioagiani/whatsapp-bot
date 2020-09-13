import { client } from "./server";

import { EconomyCommand, QuoteCommand, CepCommand } from "./app/commands";
import CommandDispatcher from "./app/utils/CommandDispatcher";

const dispatcher = new CommandDispatcher();

client.on("message", async (message: any) => {
  dispatcher.register("cotacao", new EconomyCommand());
  dispatcher.register("mencionar", new QuoteCommand());
  dispatcher.register("cep", new CepCommand(message.body));

  if (message.body.startsWith("!")) {
    dispatcher.dispatch(message.body.slice(1), message);
  }
});
