import { Router } from 'express';
import { sql } from 'drizzle-orm';
import { db } from '../../db';
import { contacts } from '../../db/schema';
import { parseLimit } from '../utils/cursor';

const router = Router();

/** GET /api/directory?q= — saved contacts from the local store, for "new chat". */
router.get('/', (req, res) => {
  const q = String(req.query.q || '').trim();
  const limit = parseLimit(req.query.limit, 50, 200);
  const like = `%${q}%`;

  const rows = db
    .select()
    .from(contacts)
    .where(
      q
        ? sql`${contacts.isMyContact} = 1 AND (${contacts.name} LIKE ${like} COLLATE NOCASE OR ${contacts.pushname} LIKE ${like} COLLATE NOCASE OR ${contacts.number} LIKE ${like})`
        : sql`${contacts.isMyContact} = 1`,
    )
    .orderBy(
      sql`coalesce(${contacts.name}, ${contacts.pushname}, ${contacts.number}) COLLATE NOCASE`,
    )
    .limit(limit)
    .all();

  res.json({ contacts: rows });
});

export default router;
