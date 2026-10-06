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

client.on('qr', (qr) => {
  botState.status = 'qr';
  botState.qr = qr;
  qrcode.generate(qr, { small: true });
});
// WhatsApp Web sometimes stalls after auth and never fires `ready`
// (seen after quick restarts). Reload the page a few times before giving up.
const READY_TIMEOUT_MS = Number(process.env.READY_TIMEOUT_MS) || 90_000;
let readyWatchdog: NodeJS.Timeout | undefined;
let readyRetries = 0;

const armReadyWatchdog = () => {
  clearTimeout(readyWatchdog);
  readyWatchdog = setTimeout(async () => {
    if (botState.status === 'ready' || readyRetries >= 3) return;
    readyRetries++;
    console.warn(
      `WhatsApp not ready ${
        READY_TIMEOUT_MS / 1000
      }s after auth — reloading (attempt ${readyRetries}/3)`,
    );
    try {
      await client.pupPage?.reload();
    } catch (error) {
      console.error('Reload failed:', error);
    }
    armReadyWatchdog();
  }, READY_TIMEOUT_MS);
};

// attachEventListeners() exposes ~20 functions; each exposeFunction installs a
// preload script on every frame, and a short-lived iframe closing mid-way
// rejects with "Target closed". The error is swallowed inside WhatsApp's
// hasSynced callback, so `ready` never fires. Exposing is idempotent
// (exposeFunctionIfAbsent), so just retry.
type Attachable = { attachEventListeners: () => Promise<void> };
const originalAttach = (
  client as unknown as Attachable
).attachEventListeners.bind(client);
(client as unknown as Attachable).attachEventListeners = async () => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await originalAttach();
    } catch (error) {
      const closed = /Target closed|detached/i.test(String(error));
      if (!closed || attempt >= 5) {
        console.error('attachEventListeners failed:', error);
        throw error;
      }
      console.warn(
        `attachEventListeners: frame closed, retrying (${attempt}/5)`,
      );
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
};

client.on('authenticated', () => {
  const c = client as unknown as {
    pupPage?: {
      evaluate: (...a: unknown[]) => Promise<unknown>;
      __dbg?: boolean;
    };
    attachEventListeners: () => Promise<void>;
    __dbg?: boolean;
  };
  if (c.pupPage && !c.pupPage.__dbg) {
    c.pupPage.__dbg = true;
    const orig = c.pupPage.evaluate.bind(c.pupPage);
    c.pupPage.evaluate = (...a: unknown[]) =>
      orig(...a).catch((e: unknown) => {
        console.error('DEBUG evaluate failed:', String(a[0]).slice(0, 120), e);
        throw e;
      });
  }
  if (!c.__dbg) {
    c.__dbg = true;
    const origAttach = c.attachEventListeners.bind(client);
    c.attachEventListeners = () =>
      origAttach().catch((e: unknown) => {
        console.error('DEBUG attachEventListeners failed:', e);
        throw e;
      });
  }
});

client.on('authenticated', () => {
  botState.status = 'authenticated';
  botState.qr = null;
  console.log('WhatsApp authenticated.');
  armReadyWatchdog();
});
client.on('loading_screen', (percent, message) => {
  console.log(`WhatsApp loading: ${percent}% ${message}`);
});
client.on('change_state', (state) => {
  console.log(`WhatsApp state: ${state}`);
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
  clearTimeout(readyWatchdog);
  readyRetries = 0;
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
