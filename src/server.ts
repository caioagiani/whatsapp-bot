import { Client, MessageMedia } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import dir from 'path';

interface INotification {
  reply: (args: string) => void;
  recipientIds: any[];
}

const sessionFile = dir.resolve('src', 'data', 'session.json');

const session = fs.existsSync(sessionFile) ? require(sessionFile) : null;

const client = new Client({
  puppeteer: {
    headless: true,
  },
  session,
});

client.on('qr', (qr: string) => {
  qrcode.generate(qr, { small: true });
});

client.on('authenticated', (session: any) => {
  fs.writeFile(sessionFile, JSON.stringify(session), (err) => {
    if (err) console.log(err);
  });
});

client.on('ready', async () => {
  console.log('WhatsApp bot conectado com sucesso!');

  const { pushname } = client.info;

  client.sendMessage('5511987454933@c.us', `[${pushname}] - WhatsApp Online`);
});

client.on('auth_failure', () => {
  fs.unlink(sessionFile, () =>
    console.log('Autenticação falhou, tente novamente.')
  );
});

client.on('disconnected', () => {
  fs.unlink(sessionFile, () =>
    console.log('Sessão WhatsApp perdeu a conexão.')
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
