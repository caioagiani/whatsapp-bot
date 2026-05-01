import request from 'supertest';
import { app } from '../server';
import { botState } from '../state';
import { client } from '../../services/whatsapp';
import { cache } from '../utils/cache';
import { mockGroups, mockNonGroup } from './mocks';

jest.mock('../../services/whatsapp', () => ({
  client: { getChats: jest.fn() },
  MessageMedia: {},
}));

const mockClient = client as jest.Mocked<typeof client>;

beforeEach(() => {
  botState.status = 'ready';
  cache.clear();
  (mockClient.getChats as jest.Mock).mockResolvedValue([
    ...mockGroups,
    mockNonGroup,
  ]);
});

describe('GET /api/groups', () => {
  it('returns 503 when bot is not ready', async () => {
    botState.status = 'authenticated';

    const res = await request(app).get('/api/groups');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Bot not ready');
  });

  it('returns only group chats', async () => {
    const res = await request(app).get('/api/groups');

    expect(res.status).toBe(200);
    expect(res.body.groups).toHaveLength(2);
  });

  it('returns pagination metadata', async () => {
    const res = await request(app).get('/api/groups');

    expect(res.body.pagination).toMatchObject({
      total: 2,
      page: 1,
      limit: 20,
      pages: 1,
    });
  });

  it('paginates groups with limit=1', async () => {
    const res = await request(app).get('/api/groups?page=1&limit=1');

    expect(res.body.groups).toHaveLength(1);
    expect(res.body.pagination).toMatchObject({
      total: 2,
      page: 1,
      limit: 1,
      pages: 2,
    });
  });

  it('returns second page', async () => {
    const res = await request(app).get('/api/groups?page=2&limit=1');

    expect(res.body.groups).toHaveLength(1);
    expect(res.body.groups[0].name).toBe('Marketing');
  });

  it('returns correct group shape', async () => {
    const res = await request(app).get('/api/groups');

    expect(res.body.groups[0]).toMatchObject({
      id: '120363000000000001@g.us',
      name: 'Dev Team',
      participantCount: 2,
    });
  });

  it('returns 500 on client error', async () => {
    (mockClient.getChats as jest.Mock).mockRejectedValue(new Error('WA error'));

    const res = await request(app).get('/api/groups');

    expect(res.status).toBe(500);
  });
});

describe('GET /api/groups/:id', () => {
  it('returns 503 when bot is not ready', async () => {
    botState.status = 'qr';

    const res = await request(app).get('/api/groups/120363000000000001@g.us');

    expect(res.status).toBe(503);
  });

  it('returns group with participants', async () => {
    const res = await request(app).get('/api/groups/120363000000000001@g.us');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('120363000000000001@g.us');
    expect(res.body.name).toBe('Dev Team');
    expect(res.body.participants).toHaveLength(2);
  });

  it('returns correct participant shape with admin flags', async () => {
    const res = await request(app).get('/api/groups/120363000000000001@g.us');

    expect(res.body.participants[0]).toMatchObject({
      id: '5511991110001@c.us',
      number: '5511991110001',
      isAdmin: true,
      isSuperAdmin: false,
    });
    expect(res.body.participants[1].isAdmin).toBe(false);
  });

  it('returns 404 when id does not match any group', async () => {
    const res = await request(app).get('/api/groups/nonexistent@g.us');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Group not found');
  });

  it('returns 404 for a non-group chat id', async () => {
    const res = await request(app).get('/api/groups/5511991110001@c.us');

    expect(res.status).toBe(404);
  });

  it('returns 500 when getChats throws', async () => {
    (mockClient.getChats as jest.Mock).mockRejectedValue(new Error('WA error'));

    const res = await request(app).get('/api/groups/120363000000000001@g.us');

    expect(res.status).toBe(500);
  });
});
