import { Router } from 'express';
import type { Contact } from 'whatsapp-web.js';
import { client } from '../../services/whatsapp';
import { botState } from '../state';
import { paginate, parsePagination } from '../utils/paginate';
import { cache } from '../utils/cache';

const router = Router();

type ContactRow = {
  id: string;
  name: string | null;
  number: string;
  isMyContact: boolean;
};

async function getAllContacts(): Promise<ContactRow[]> {
  const cached = cache.get<ContactRow[]>('contacts');
  if (cached) return cached;

  const contacts = await client.getContacts();
  const result = (contacts as Contact[])
    .filter((c) => !c.isGroup && c.number)
    .map((c) => ({
      id: c.id._serialized,
      name: c.name || c.pushname || null,
      number: c.number,
      isMyContact: c.isMyContact,
    }));

  cache.set('contacts', result);
  return result;
}

router.get('/', async (req, res) => {
  if (botState.status !== 'ready') {
    res.status(503).json({ error: 'Bot not ready', status: botState.status });
    return;
  }

  try {
    const all = await getAllContacts();
    const { page, limit } = parsePagination(req);
    const { data, pagination } = paginate(all, page, limit);
    res.json({ contacts: data, pagination });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

router.get('/search', async (req, res) => {
  if (botState.status !== 'ready') {
    res.status(503).json({ error: 'Bot not ready', status: botState.status });
    return;
  }

  const q = String(req.query.q || '')
    .toLowerCase()
    .trim();
  if (!q) {
    res.status(400).json({ error: 'Missing query param: q' });
    return;
  }

  try {
    const all = await getAllContacts();
    const filtered = all.filter(
      (c) => c.number.includes(q) || (c.name || '').toLowerCase().includes(q),
    );

    const { page, limit } = parsePagination(req);
    const { data, pagination } = paginate(filtered, page, limit);
    res.json({ contacts: data, pagination });
  } catch (error) {
    console.error('Error searching contacts:', error);
    res.status(500).json({ error: 'Failed to search contacts' });
  }
});

export default router;
