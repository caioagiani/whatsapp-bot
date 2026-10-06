import { Client, MessageMedia, LocalAuth } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import { resolve } from 'path';
import { botState } from '../api/state';
import { cache } from '../api/utils/cache';
import { company } from '../config/integrantes.json';

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

// whatsapp-web.js re-runs inject() on every framenavigated without awaiting the
// previous run, so two injects race on exposeFunction and crash. Serialize them.
type Injectable = { inject: () => Promise<void> };
const originalInject = (client as unknown as Injectable).inject.bind(client);
let injectQueue: Promise<void> = Promise.resolve();
(client as unknown as Injectable).inject = () => {
  injectQueue = injectQueue.catch(() => undefined).then(() => originalInject());
  return injectQueue;
};

client.on('qr', (qr) => {
  botState.status = 'qr';
  botState.qr = qr;
  qrcode.generate(qr, { small: true });
});
client.on('authenticated', () => {
  botState.status = 'authenticated';
  botState.qr = null;
  console.log('WhatsApp authenticated.');
});
client.on('auth_failure', () => {
  botState.status = 'disconnected';
  console.log('WhatsApp authentication failed.');
});
client.on('disconnected', () => {
  botState.status = 'disconnected';
  cache.clear();
  console.log('WhatsApp lost connection.');
});
client.on('ready', async () => {
  botState.status = 'ready';
  botState.botName = client.info.pushname;

  const ownerPhone =
    process.env.BOT_OWNER_PHONE || company.find((m) => m.admin)?.numero;

  if (ownerPhone) {
    try {
      await client.sendMessage(
        `${ownerPhone}@c.us`,
        `[${client.info.pushname}] - WhatsApp Online\n\n[⭐] Please *star* this project: https://github.com/caioagiani/whatsapp-bot\n\n[💝] Sponsor this project: https://github.com/sponsors/caioagiani`,
      );
    } catch (error) {
      console.error('Failed to send ready notification:', error);
    }
  }

  console.log('WhatsApp bot successfully connected!');
});

client.initialize();

export { client, MessageMedia };
