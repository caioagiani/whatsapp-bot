import { Router } from 'express';
import { client } from '../../services/whatsapp';
import { botState } from '../state';
import { getMediaFile } from '../../services/media';
import { getMessage } from '../../sync/store';

const router = Router();

router.post('/send', async (req, res) => {
  if (botState.status !== 'ready') {
    res.status(503).json({ error: 'Bot not ready', status: botState.status });
    return;
  }

  const { to, text } = req.body as { to?: string; text?: string };

  if (!to || !text) {
    res
      .status(400)
      .json({ error: 'Body must include: to (phone number or chat id), text' });
    return;
  }

  const chatId = to.includes('@') ? to : `${to}@c.us`;

  try {
    await client.sendMessage(chatId, text);
    res.json({ success: true, to: chatId });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.get('/:id/media', async (req, res) => {
  const row = getMessage(req.params.id);
  if (!row?.hasMedia) {
    res.status(404).json({ error: 'Media not found' });
    return;
  }
  if (!row.mediaPath && botState.status !== 'ready') {
    res.status(503).json({ error: 'Bot not ready', status: botState.status });
    return;
  }

  try {
    const path = await getMediaFile(row.id);
    if (!path) {
      res.status(404).json({ error: 'Media not available' });
      return;
    }
    const mime = getMessage(row.id)?.mediaMime;
    if (mime) res.type(mime.split(';')[0]);
    if (req.query.download === '1' && row.mediaFilename) {
      res.attachment(row.mediaFilename);
    }
    // Media is content-addressed by message id, so it never changes.
    res.set('Cache-Control', 'private, max-age=31536000, immutable');
    res.sendFile(path);
  } catch (error) {
    console.error('Error downloading media:', error);
    res.status(500).json({ error: 'Failed to download media' });
  }
});

export default router;
