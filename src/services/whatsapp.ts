import {
  Client,
  ClientOptions,
  ClientSession,
  MessageMedia,
} from 'whatsapp-web.js';
import { generate } from 'qrcode-terminal';
import { existsSync, writeFile, unlink } from 'fs';
import { resolve } from 'path';

const sessionFile = resolve('src', 'data', 'session.json');
const session: ClientSession = existsSync(sessionFile) && require(sessionFile);
const optionsClient: ClientOptions = {
  puppeteer: {
    headless: true,
    args: ['--no-sandbox'],
  },
  session,
};

const client: Client = new Client(optionsClient);

client.on('qr', (qr: string) => {
  generate(qr, { small: true });
});

client.on('authenticated', (dataSession: ClientSession) => {
  writeFile(sessionFile, JSON.stringify(dataSession), (err) => {
    if (err) console.log(err);
  });
});

client.on('ready', async () => {
  console.log('WhatsApp bot successfully connected!');

  await client.sendMessage(
    '5511963928063@c.us',
    `[${client.info.pushname}] - WhatsApp Online\n\n[x] Star project: https://github.com/caioagiani/whatsapp-bot`,
  );
});

client.on('auth_failure', () => {
  unlink(sessionFile, () => {
    console.log('Authentication failed, try again.');
    process.exit(1);
  });
});

client.on('disconnected', () => {
  unlink(sessionFile, () =>
    console.log('WhatsApp session lost connection, try again.'),
  );
});

client.initialize();

export { client, MessageMedia };
