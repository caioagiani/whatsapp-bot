import { client, MessageMedia } from "../../server";
import { readFileSync } from "fs";

import { launch } from "puppeteer";
import { resolve } from "path";

let commandExecute: boolean = false;

interface IPassagem {
  getContact: () => any;
  getChat: () => any;
  reply: (args: string) => void;
  from: string;
}

export default async (msg: IPassagem) => {
  const chat = await msg.getChat();
  const user = await msg.getContact();

  chat.sendStateTyping();

  if (commandExecute)
    return msg.reply(
      "🤖: existe um processo em execução, por favor aguarde..."
    );

  msg.reply(`🤖: @${user.id.user}, coletando informações do *Zabbix*...`);

  commandExecute = true;

  const browser = await launch({
    headless: true,
    args: [
      "--start-maximized",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
      "--window-size=1200x900",
    ],
  });

  const page = await browser.newPage();
  const path = resolve("public", "images", "zabbix.png");

  await page.goto(process.env.ZABBIX_URL, {
    waitUntil: "load",
    timeout: 0,
  });

  await page.setViewport({ width: 1150, height: 800 });
  await page.waitFor(2000);
  await page.screenshot({ path });
  await browser.close();

  const media = new MessageMedia(
    "image/png",
    readFileSync(path, "base64"),
    "zabbix_automatico.png"
  );

  commandExecute = false;

  client.sendMessage(msg.from, media);
};
