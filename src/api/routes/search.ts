import { Router } from 'express';
import { sqlite } from '../../db';
import { parseLimit } from '../utils/cursor';

const router = Router();

// Each word becomes a quoted prefix term, so user input can't inject FTS syntax.
const toFtsQuery = (q: string) =>
  q
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `"${w.replace(/"/g, '""')}"*`)
    .join(' ');

const searchStmt = sqlite.prepare(`
  SELECT m.id, m.chat_id AS chatId, m.from_me AS fromMe, m.author_name AS authorName,
         m.body, m.type, m.timestamp, c.name AS chatName, c.is_group AS isGroup,
         snippet(messages_fts, 0, '<<', '>>', '…', 12) AS snippet
  FROM messages_fts
  JOIN messages m ON m.rowid = messages_fts.rowid
  LEFT JOIN chats c ON c.id = m.chat_id
  WHERE messages_fts MATCH ?
  ORDER BY m.timestamp DESC
  LIMIT ?
`);

router.get('/', (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) {
    res.json({ results: [] });
    return;
  }
  const rows = searchStmt.all(toFtsQuery(q), parseLimit(req.query.limit, 30));
  res.json({
    results: (rows as Record<string, unknown>[]).map((r) => ({
      ...r,
      fromMe: Boolean(r.fromMe),
      isGroup: Boolean(r.isGroup),
    })),
  });
});

export default router;
