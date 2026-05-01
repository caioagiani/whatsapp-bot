import request from 'supertest';
import { app } from '../server';
import { botState } from '../state';
import { client } from '../../services/whatsapp';
import { cache } from '../utils/cache';
import { mockContacts } from './mocks';

jest.mock('../../services/whatsapp', () => ({
  client: { getContacts: jest.fn() },
  MessageMedia: {},
}));

const mockClient = client as jest.Mocked<typeof client>;

beforeEach(() => {
  botState.status = 'ready';
  cache.clear();
  (mockClient.getContacts as jest.Mock).mockResolvedValue(mockContacts);
});

describe('GET /api/contacts', () => {
  it('returns 503 when bot is not ready', async () => {
    botState.status = 'initializing';

    const res = await request(app).get('/api/contacts');

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Bot not ready');
  });

  it('returns contacts list filtering out groups', async () => {
    const res = await request(app).get('/api/contacts');

    expect(res.status).toBe(200);
    expect(res.body.contacts).toHaveLength(3); // 4 mocks - 1 group
  });

  it('returns pagination metadata', async () => {
    const res = await request(app).get('/api/contacts');

    expect(res.body.pagination).toMatchObject({
      total: 3,
      page: 1,
      limit: 20,
      pages: 1,
    });
  });

  it('paginates with page and limit params', async () => {
    const res = await request(app).get('/api/contacts?page=1&limit=2');

    expect(res.status).toBe(200);
    expect(res.body.contacts).toHaveLength(2);
    expect(res.body.pagination).toMatchObject({ total: 3, page: 1, limit: 2, pages: 2 });
  });

  it('returns second page correctly', async () => {
    const res = await request(app).get('/api/contacts?page=2&limit=2');

    expect(res.body.contacts).toHaveLength(1);
    expect(res.body.pagination.page).toBe(2);
  });

  it('returns empty data for out-of-range page', async () => {
    const res = await request(app).get('/api/contacts?page=99&limit=20');

    expect(res.body.contacts).toHaveLength(0);
    expect(res.body.pagination.total).toBe(3);
  });

  it('caps limit at 100', async () => {
    const res = await request(app).get('/api/contacts?limit=999');

    expect(res.body.pagination.limit).toBe(100);
  });

  it('returns correct contact shape', async () => {
    const res = await request(app).get('/api/contacts');

    expect(res.body.contacts[0]).toMatchObject({
      id: '5511991110001@c.us',
      name: 'Alice Silva',
      number: '5511991110001',
      isMyContact: true,
    });
  });

  it('falls back to pushname when name is null', async () => {
    const res = await request(app).get('/api/contacts');
    const carlos = res.body.contacts.find(
      (c: { number: string }) => c.number === '5511991110003',
    );

    expect(carlos.name).toBe('Carlos');
  });

  it('returns 500 on client error', async () => {
    (mockClient.getContacts as jest.Mock).mockRejectedValue(new Error('WA error'));

    const res = await request(app).get('/api/contacts');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to fetch contacts');
  });
});

describe('GET /api/contacts/search', () => {
  it('returns 400 when q param is missing', async () => {
    const res = await request(app).get('/api/contacts/search');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/q/);
  });

  it('returns 503 when bot is not ready', async () => {
    botState.status = 'qr';

    const res = await request(app).get('/api/contacts/search?q=alice');

    expect(res.status).toBe(503);
  });

  it('finds contact by name (case-insensitive)', async () => {
    const res = await request(app).get('/api/contacts/search?q=alice');

    expect(res.status).toBe(200);
    expect(res.body.contacts).toHaveLength(1);
    expect(res.body.contacts[0].name).toBe('Alice Silva');
  });

  it('finds contact by number', async () => {
    const res = await request(app).get('/api/contacts/search?q=5511991110002');

    expect(res.status).toBe(200);
    expect(res.body.contacts).toHaveLength(1);
    expect(res.body.contacts[0].number).toBe('5511991110002');
  });

  it('finds contact by pushname', async () => {
    const res = await request(app).get('/api/contacts/search?q=carlos');

    expect(res.status).toBe(200);
    expect(res.body.contacts).toHaveLength(1);
  });

  it('returns empty for no match', async () => {
    const res = await request(app).get('/api/contacts/search?q=zzznomatch');

    expect(res.status).toBe(200);
    expect(res.body.contacts).toHaveLength(0);
    expect(res.body.pagination.total).toBe(0);
  });

  it('never returns groups in search results', async () => {
    const res = await request(app).get('/api/contacts/search?q=group');

    expect(res.body.contacts).toHaveLength(0);
  });

  it('paginates search results', async () => {
    const res = await request(app).get('/api/contacts/search?q=5511&page=1&limit=2');

    expect(res.status).toBe(200);
    expect(res.body.contacts).toHaveLength(2);
    expect(res.body.pagination).toMatchObject({ total: 3, page: 1, limit: 2, pages: 2 });
  });
});
