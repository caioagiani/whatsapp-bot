import request from 'supertest';
import { app } from '../server';
import { botState } from '../state';
import { client } from '../../services/whatsapp';
import { sqlite } from '../../db';
import { touchChat, upsertChats, upsertMessages } from '../../sync/store';

jest.mock('../../services/whatsapp', () => ({
  client: {
    sendMessage: jest.fn(),
    sendSeen: jest.fn().mockResolvedValue(true),
    getChatById: jest.fn(),
  },
  MessageMedia: jest.fn(),
}));

jest.mock('../../realtime/ws', () => ({
  broadcast: jest.fn(),
  attachRealtime: jest.fn(),
}));

const mockClient = client as jest.Mocked<typeof client>;

const chat = (id: string, at: number, extra = {}) => ({
  id,
  name: id.split('@')[0],
  isGroup: id.endsWith('@g.us'),
  unreadCount: 0,
  archived: false,
  pinned: false,
  muted: false,
  lastMessageAt: at,
  ...extra,
});

const msg = (chatId: string, n: number, body = `msg ${n}`) => ({
  id: `false_${chatId}_${n}`,
  chatId,
  fromMe: false,
  body,
  type: 'chat',
  timestamp: 1000 + n,
});

beforeEach(() => {
  jest.clearAllMocks();
  sqlite.exec('DELETE FROM messages; DELETE FROM chats; DELETE FROM contacts;');
  botState.status = 'disconnected';
});

describe('GET /api/chats', () => {
  it('paginates with keyset cursor, pinned first then newest', async () => {
    upsertChats([
      chat('a@c.us', 100),
      chat('b@c.us', 300),
      chat('c@c.us', 200),
      chat('pin@c.us', 50, { pinned: true }),
      chat('arch@c.us', 999, { archived: true }),
    ]);

    const first = await request(app).get('/api/chats?limit=2');
    expect(first.status).toBe(200);
    expect(first.body.chats.map((c: { id: string }) => c.id)).toEqual([
      'pin@c.us',
      'b@c.us',
    ]);
    expect(first.body.nextCursor).toBeTruthy();

    const second = await request(app).get(
      `/api/chats?limit=2&cursor=${first.body.nextCursor}`,
    );
    expect(second.body.chats.map((c: { id: string }) => c.id)).toEqual([
      'c@c.us',
      'a@c.us',
    ]);
    expect(second.body.nextCursor).toBeNull();
  });

  it('filters archived and by name', async () => {
    upsertChats([
      chat('alice@c.us', 1),
      chat('arch@c.us', 2, { archived: true }),
    ]);

    const archived = await request(app).get('/api/chats?archived=1');
    expect(archived.body.chats).toHaveLength(1);
    expect(archived.body.chats[0].id).toBe('arch@c.us');

    const byName = await request(app).get('/api/chats?q=ALI');
    expect(byName.body.chats.map((c: { id: string }) => c.id)).toEqual([
      'alice@c.us',
    ]);
  });
});

describe('GET /api/chats/:id/messages', () => {
  it('pages older messages in chronological order', async () => {
    upsertChats([chat('a@c.us', 0, { historyComplete: true })]);
    upsertMessages(Array.from({ length: 5 }, (_, i) => msg('a@c.us', i + 1)));
    sqlite.exec(`UPDATE chats SET history_complete = 1`);

    const first = await request(app).get('/api/chats/a@c.us/messages?limit=3');
    expect(first.body.messages.map((m: { body: string }) => m.body)).toEqual([
      'msg 3',
      'msg 4',
      'msg 5',
    ]);
    expect(first.body.nextCursor).toBeTruthy();

    const older = await request(app).get(
      `/api/chats/a@c.us/messages?limit=3&before=${first.body.nextCursor}`,
    );
    expect(older.body.messages.map((m: { body: string }) => m.body)).toEqual([
      'msg 1',
      'msg 2',
    ]);
    expect(older.body.nextCursor).toBeNull();
  });
});

describe('message serialization', () => {
  it('never exposes server media paths', async () => {
    upsertChats([chat('a@c.us', 0)]);
    upsertMessages([
      { ...msg('a@c.us', 1), hasMedia: true, mediaPath: '/srv/secret.jpg' },
    ]);
    sqlite.exec('UPDATE chats SET history_complete = 1');
    const res = await request(app).get('/api/chats/a@c.us/messages');
    expect(res.body.messages[0].hasMedia).toBe(true);
    expect(res.body.messages[0]).not.toHaveProperty('mediaPath');
  });
});

describe('denormalized last message', () => {
  it('only moves forward in time', () => {
    upsertChats([chat('a@c.us', 0)]);
    touchChat(msg('a@c.us', 5));
    touchChat(msg('a@c.us', 2));
    const row = sqlite
      .prepare('SELECT last_message_preview AS p FROM chats WHERE id = ?')
      .get('a@c.us') as { p: string };
    expect(row.p).toBe('msg 5');
  });
});

describe('GET /api/search', () => {
  it('finds messages accent-insensitively by prefix', async () => {
    upsertChats([chat('a@c.us', 0)]);
    upsertMessages([
      msg('a@c.us', 1, 'Reunião amanhã cedo'),
      msg('a@c.us', 2, 'outra coisa'),
    ]);

    const res = await request(app).get('/api/search?q=reuni');
    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].body).toBe('Reunião amanhã cedo');
  });

  it('does not break on FTS syntax in the query', async () => {
    const res = await request(app).get('/api/search?q=%22AND%20OR(*');
    expect(res.status).toBe(200);
  });
});

describe('POST /api/chats/:id/messages', () => {
  it('returns 503 when bot is not ready', async () => {
    const res = await request(app)
      .post('/api/chats/a@c.us/messages')
      .send({ text: 'hi' });
    expect(res.status).toBe(503);
  });

  it('sends text and stores it', async () => {
    botState.status = 'ready';
    (mockClient.sendMessage as jest.Mock).mockResolvedValue({
      id: { _serialized: 'true_a@c.us_X1', remote: 'a@c.us' },
      fromMe: true,
      from: 'me@c.us',
      to: 'a@c.us',
      body: 'hi',
      type: 'chat',
      timestamp: 2000,
      ack: 1,
      hasMedia: false,
    });

    const res = await request(app)
      .post('/api/chats/a@c.us/messages')
      .send({ text: 'hi' });

    expect(res.status).toBe(201);
    expect(res.body.message.body).toBe('hi');
    const list = await request(app).get('/api/chats');
    expect(list.body.chats[0]).toMatchObject({
      id: 'a@c.us',
      lastMessagePreview: 'hi',
      lastMessageFromMe: true,
    });
  });

  it('refuses chats where the bot cannot post', async () => {
    botState.status = 'ready';
    upsertChats([chat('g@g.us', 0, { sendRestriction: 'admins' })]);
    const res = await request(app)
      .post('/api/chats/g@g.us/messages')
      .send({ text: 'hi' });
    expect(res.status).toBe(403);
    expect(res.body.restriction).toBe('admins');
    expect(mockClient.sendMessage).not.toHaveBeenCalled();
  });

  it('keeps the stored restriction when an update omits it', async () => {
    upsertChats([chat('g@g.us', 0, { sendRestriction: 'admins' })]);
    upsertChats([chat('g@g.us', 5)]);
    const res = await request(app).get('/api/chats/g@g.us');
    expect(res.body.sendRestriction).toBe('admins');

    upsertChats([chat('g@g.us', 6, { sendRestriction: null })]);
    const cleared = await request(app).get('/api/chats/g@g.us');
    expect(cleared.body.sendRestriction).toBeNull();
  });

  it('rejects empty message', async () => {
    botState.status = 'ready';
    const res = await request(app).post('/api/chats/a@c.us/messages').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/chats/:id/seen', () => {
  it('clears unread count', async () => {
    upsertChats([chat('a@c.us', 0, { unreadCount: 4 })]);
    await request(app).post('/api/chats/a@c.us/seen').expect(200);
    const list = await request(app).get('/api/chats');
    expect(list.body.chats[0].unreadCount).toBe(0);
  });
});

describe('refreshChatLastMessage', () => {
  it('fills preview even when chat timestamp is ahead of its messages', () => {
    const { refreshChatLastMessage } = jest.requireActual('../../sync/store');
    upsertChats([chat('a@c.us', 99999)]);
    upsertMessages([msg('a@c.us', 1, 'old one')]);
    refreshChatLastMessage('a@c.us');
    const row = sqlite
      .prepare(
        'SELECT last_message_preview AS p, last_message_at AS t FROM chats WHERE id = ?',
      )
      .get('a@c.us') as { p: string; t: number };
    expect(row).toEqual({ p: 'old one', t: 99999 });
  });
});

describe('ack sync', () => {
  it('updates and broadcasts the chat when its last message is acked', () => {
    const { broadcast } = jest.requireMock('../../realtime/ws') as {
      broadcast: jest.Mock;
    };
    broadcast.mockClear();
    const handlers: Record<string, (...a: unknown[]) => void> = {};
    const { attachSync } = jest.requireActual('../../sync');
    attachSync({ on: (e: string, fn: () => void) => (handlers[e] = fn) });

    upsertChats([chat('a@c.us', 0)]);
    const sent = {
      ...msg('a@c.us', 9, 'hey'),
      id: 'true_a@c.us_9',
      fromMe: true,
      ack: 1,
    };
    upsertMessages([sent]);
    touchChat(sent);

    handlers.message_ack(
      {
        id: { _serialized: 'true_a@c.us_9_out', remote: 'a@c.us' },
        fromMe: true,
        to: 'a@c.us',
      },
      3,
    );

    const row = sqlite
      .prepare('SELECT last_message_ack AS a FROM chats WHERE id = ?')
      .get('a@c.us') as { a: number };
    expect(row.a).toBe(3);
    expect(broadcast).toHaveBeenCalledWith(
      'chat.update',
      expect.objectContaining({ id: 'a@c.us', lastMessageAck: 3 }),
    );
  });
});
