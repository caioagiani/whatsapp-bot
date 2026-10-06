import type { Server } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

export type RealtimeEvent =
  | 'status'
  | 'message.new'
  | 'message.update'
  | 'chat.update'
  | 'chat.remove'
  | 'sync';

const wss = new WebSocketServer({ noServer: true });

export const attachRealtime = (server: Server): void => {
  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url || '/', 'http://localhost');
    if (url.pathname !== '/ws') {
      socket.destroy();
      return;
    }

    const apiKey = process.env.API_KEY;
    if (apiKey && url.searchParams.get('key') !== apiKey) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws));
  });

  // Drop dead connections so broadcast doesn't pile up on half-open sockets.
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const alive = ws as WebSocket & { isAlive?: boolean };
      if (alive.isAlive === false) {
        ws.terminate();
        return;
      }
      alive.isAlive = false;
      ws.ping();
    });
  }, 30_000);

  wss.on('connection', (ws) => {
    const alive = ws as WebSocket & { isAlive?: boolean };
    alive.isAlive = true;
    ws.on('pong', () => {
      alive.isAlive = true;
    });
  });

  server.on('close', () => {
    clearInterval(interval);
    wss.close();
  });
};

export const broadcast = (type: RealtimeEvent, data: unknown): void => {
  if (wss.clients.size === 0) return;
  const payload = JSON.stringify({ type, data });
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(payload);
  });
};
