import express from 'express';
import { apiKeyAuth } from './middleware/auth';
import statusRouter from './routes/status';
import contactsRouter from './routes/contacts';
import groupsRouter from './routes/groups';
import messagesRouter from './routes/messages';

const app = express();
app.use(express.json());
app.use(apiKeyAuth);

app.use('/api/status', statusRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/messages', messagesRouter);

export { app };

export const startApiServer = (): import('http').Server => {
  const port = Number(process.env.API_PORT) || 3000;
  return app.listen(port, () => {
    console.log(`HTTP API running on http://localhost:${port}`);
  });
};
