import Command from "./Command";
import HttpClient from "../infrastructure/HttpClient";
import { client, MessageMedia } from "../../server";
import { readFileSync } from "fs";

import puppeteer from "puppeteer";
import dir from "path";

let commandExecute: boolean = false;

interface IPassagem {
  getContact: () => any;
  getChat: () => any;
  reply: (args: string) => void;
  from: string;
}

export default class PassagemCommand extends Command<IPassagem> {
  constructor(private readonly httpClient: HttpClient) {
    super();
  }

  async execute(msg: IPassagem) {
    const chat = await msg.getChat();
    const user = await msg.getContact();

    chat.sendStateTyping();

    if (commandExecute) {
      msg.reply("🤖: existe um processo em execução, por favor aguarde...");
      return;
    }

    msg.reply(`🤖: @${user.id.user}, gerando passagem de *turno*, aguarde...`);

    commandExecute = true;

    const url = process.env?.TURNO_API;

    const response = await this.httpClient.get<{
      total: string;
      chamados: any[];
    }>(url);

    if (response.statusCode !== 200) {
      msg.reply("Este comando não está habilitado.");
      return;
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--start-maximized",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920x800",
      ],
    });

    const page = await browser.newPage();
    const path = dir.resolve("public", "images", "turno.png");

    await page.goto(process.env.PRINT_URL, {
      waitUntil: "load",
      timeout: 0,
    });

    await page.setViewport({ width: 1450, height: 900 });
    await page.screenshot({ path });
    await browser.close();

    const { total, chamados } = response.body;

    const row = (protocol: { fila?: string; value?: string }) => {
      return `${protocol.fila}: *${protocol.value}*`;
    };

    const allchamados = `CHAMADOS TOTAL: *${total}*`;
    const ativacao = row(chamados[0]);
    const bloqueio = row(chamados[1]);
    const cancelamento = row(chamados[2]);
    const circuito = row(chamados[3]);
    const corporativo = row(chamados[4]);
    const nivel1 = row(chamados[5]);
    const proativo = row(chamados[6]);
    const residencial = row(chamados[7]);

    const mensagem = `${allchamados} \n\n${ativacao} \n${bloqueio} \n${cancelamento} \n${circuito} \n${corporativo} \n${nivel1} \n${proativo} \n${residencial}`;

    const media = new MessageMedia(
      "image/png",
      readFileSync(path, "base64"),
      "passagem_automatica_bot.png",
    );

    commandExecute = false;
    // msg.reply(mensagem);
    client.sendMessage(msg.from, mensagem);
    client.sendMessage(msg.from, media);
  }
}
