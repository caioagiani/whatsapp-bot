import express from 'express';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { apiKeyAuth } from './middleware/auth';
import statusRouter from './routes/status';
import contactsRouter from './routes/contacts';
import groupsRouter from './routes/groups';
import messagesRouter from './routes/messages';
import chatsRouter from './routes/chats';
import searchRouter from './routes/search';
import directoryRouter from './routes/directory';
import { attachRealtime } from '../realtime/ws';

const app = express();
app.use(express.json());
app.use('/api', apiKeyAuth);

app.use('/api/status', statusRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/chats', chatsRouter);
app.use('/api/search', searchRouter);
app.use('/api/directory', directoryRouter);

// Web UI (web/dist), built with `npm run web:build`.
const webDist = resolve(process.cwd(), 'web', 'dist');
if (existsSync(webDist)) {
  app.use(
    express.static(webDist, {
      index: false,
      setHeaders: (res, path) => {
        if (path.includes(`${resolve(webDist, 'assets')}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }),
  );
  app.get(/^\/(?!api\/|ws$).*/, (_req, res) =>
    res.sendFile(resolve(webDist, 'index.html')),
  );
}

export { app };

export const startApiServer = (): import('http').Server => {
  const port = Number(process.env.API_PORT) || 3000;
  const server = app.listen(port, () => {
    console.log(`HTTP API running on http://localhost:${port}`);
  });
  attachRealtime(server);
  return server;
};
