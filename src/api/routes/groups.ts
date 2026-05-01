import { Router } from 'express';
import type { Chat, GroupChat } from 'whatsapp-web.js';
import { client } from '../../services/whatsapp';
import { botState } from '../state';
import { paginate, parsePagination } from '../utils/paginate';
import { cache } from '../utils/cache';

const router = Router();

async function getAllChats(): Promise<Chat[]> {
  const cached = cache.get<Chat[]>('chats');
  if (cached) return cached;

  const chats = await client.getChats();
  cache.set('chats', chats);
  return chats;
}

router.get('/', async (req, res) => {
  if (botState.status !== 'ready') {
    res.status(503).json({ error: 'Bot not ready', status: botState.status });
    return;
  }

  try {
    const chats = await getAllChats();
    const all = (chats.filter((c) => c.isGroup) as GroupChat[]).map((g) => ({
      id: g.id._serialized,
      name: g.name,
      participantCount: g.participants.length,
    }));

    const { page, limit } = parsePagination(req);
    const { data, pagination } = paginate(all, page, limit);
    res.json({ groups: data, pagination });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups' });
  }
});

router.get('/:id', async (req, res) => {
  if (botState.status !== 'ready') {
    res.status(503).json({ error: 'Bot not ready', status: botState.status });
    return;
  }

  try {
    const chats = await getAllChats();
    const group = chats.find(
      (c) => c.isGroup && c.id._serialized === req.params.id,
    ) as GroupChat | undefined;

    if (!group) {
      res.status(404).json({ error: 'Group not found' });
      return;
    }

    res.json({
      id: group.id._serialized,
      name: group.name,
      participants: group.participants.map((p) => ({
        id: p.id._serialized,
        number: p.id.user,
        isAdmin: p.isAdmin,
        isSuperAdmin: p.isSuperAdmin,
      })),
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

export default router;
