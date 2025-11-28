import { Client, MessageMedia, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { resolve } from 'path';

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: 'wpp-bot',
    dataPath: resolve(__dirname, '..', 'data'),
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox'],
  },
});

client.on('qr', async (qr) => qrcode.generate(qr, { small: true }));
client.on('authenticated', () => console.log('WhatsApp authenticated.'));
client.on('auth_failure', () => console.log('WhatsApp authentication failed.'));
client.on('disconnected', () => console.log('WhatsApp lost connection.'));
client.on('ready', async () => {
  await client.sendMessage(
    '5511999865802@c.us',
    `[${client.info.pushname}] - WhatsApp Online\n\n[⭐] Please *star* this project: https://github.com/caioagiani/whatsapp-bot\n\n[💝] Sponsor this project: https://github.com/sponsors/caioagiani`,
  );

  console.log('WhatsApp bot successfully connected!');
});

client.initialize();

export { client, MessageMedia };
