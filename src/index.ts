import { client } from './services/whatsapp';
import { CommandHandler } from './app/commands';
import { startApiServer } from './api/server';
import { setupGracefulShutdown } from './services/shutdown';
import { attachSync } from './sync';

attachSync(client);
client.on('message_create', CommandHandler);
const server = startApiServer();
setupGracefulShutdown(server);
