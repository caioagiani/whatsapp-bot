import { Client, MessageMedia, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox'],
  },
});

client.on('qr', async (qr) => qrcode.generate(qr, { small: true }));
client.on('authenticated', () => console.log('authenticated'));
client.on('auth_failure', () => console.log('Authentication failed.'));
client.on('disconnected', () => console.log('WhatsApp lost connection.'));
client.on('ready', async () => {
  await client.sendMessage(
    '5511999865802@c.us',
    `[${client.info.pushname}] - WhatsApp Online\n[x] Please, *like* project: https://github.com/caioagiani/whatsapp-bot`,
  );

  console.log('WhatsApp bot successfully connected!');
});

client.initialize();

export { client, MessageMedia };
