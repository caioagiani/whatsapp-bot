import { Client, MessageMedia } from "whatsapp-web.js";
import * as qrcode from "qrcode-terminal";

const client = new Client();

client.on("qr", (qr: any) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("WhatsApp bot started.");
});

client.initialize();

export { client, MessageMedia };
