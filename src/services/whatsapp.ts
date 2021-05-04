import { Client, MessageMedia } from 'whatsapp-web.js';
import { generate } from 'qrcode-terminal';
import { existsSync, writeFile, unlink } from 'fs';
import { resolve } from 'path';

interface INotification {
  reply: (args: string) => void;
  recipientIds: any[];
}

const sessionFile = resolve('src', 'data', 'session.json');

const session = existsSync(sessionFile) ? require(sessionFile) : null;

const client = new Client({
  puppeteer: {
    headless: true,
    args: ['--no-sandbox'],
  },
  session,
} as any);

client.on('qr', (qr: string) => {
  generate(qr, { small: true });
});

client.on('authenticated', (session: any) => {
  writeFile(sessionFile, JSON.stringify(session), (err) => {
    if (err) console.log(err);
  });
});

client.on('ready', async () => {
  console.log('WhatsApp bot conectado com sucesso!');

  const { pushname } = client.info;

  client.sendMessage(
    '5511963928063@c.us',
    `[${pushname}] - WhatsApp Online\n\n[x] Star on project: https://github.com/caioagiani/whatsapp-bot`,
  );
});

client.on('auth_failure', () => {
  unlink(sessionFile, () => {
    console.log('Autenticação falhou, tente novamente.');
    process.exit(1);
  });
});

client.on('disconnected', () => {
  unlink(sessionFile, () =>
    console.log('Sessão WhatsApp perdeu a conexão, tente novamente.'),
  );
});

client.on('group_join', (notification: INotification) => {
  notification.reply(`${notification.recipientIds[0]} entrou no grupo.`);
});

client.on('group_leave', (notification: INotification) => {
  notification.reply(`${notification.recipientIds[0]} saiu do grupo.`);
});

client.initialize();

export { client, MessageMedia };
