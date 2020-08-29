import { client } from "./server";

import { EconomyCommand, QuoteCommand } from "./app/commands";
import CommandDispatcher from "./app/utils/CommandDispatcher";

const dispatcher = new CommandDispatcher();

dispatcher.register("cotacao", new EconomyCommand());
dispatcher.register("mencionar", new QuoteCommand());

client.on("message", async (message: any) => {
  if (message.body.startsWith("!")) {
    dispatcher.dispatch(message.body.slice(1), message);
  }
});
