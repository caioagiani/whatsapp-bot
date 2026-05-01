import type { Server } from 'http';
import { client } from './whatsapp';
import { cache } from '../api/utils/cache';

export const setupGracefulShutdown = (server: Server): void => {
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n${signal} received — shutting down...`);

    server.close(() => console.log('HTTP server closed.'));

    try {
      await client.destroy();
      console.log('WhatsApp client destroyed.');
    } catch {
      // already disconnected
    }

    cache.clear();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};
