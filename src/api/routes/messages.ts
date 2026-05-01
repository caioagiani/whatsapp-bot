import { Router } from 'express';
import { client } from '../../services/whatsapp';
import { botState } from '../state';

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

export default router;
