import request from 'supertest';
import { app } from '../server';
import { botState } from '../state';

jest.mock('../../services/whatsapp', () => ({
  client: {},
  MessageMedia: {},
}));

describe('API Key auth middleware', () => {
  const originalKey = process.env.API_KEY;

  afterEach(() => {
    process.env.API_KEY = originalKey;
    botState.status = 'ready';
  });

  it('allows requests when API_KEY is not configured', async () => {
    delete process.env.API_KEY;
    botState.status = 'ready';

    const res = await request(app).get('/api/status');

    expect(res.status).toBe(200);
  });

  it('returns 401 when API_KEY is set and Authorization header is missing', async () => {
    process.env.API_KEY = 'secret-token';

    const res = await request(app).get('/api/status');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('returns 401 when wrong token is provided', async () => {
    process.env.API_KEY = 'secret-token';

    const res = await request(app)
      .get('/api/status')
      .set('Authorization', 'Bearer wrong-token');

    expect(res.status).toBe(401);
  });

  it('allows request when correct Bearer token is provided', async () => {
    process.env.API_KEY = 'secret-token';
    botState.status = 'ready';

    const res = await request(app)
      .get('/api/status')
      .set('Authorization', 'Bearer secret-token');

    expect(res.status).toBe(200);
  });

  it('allows request with lowercase bearer scheme', async () => {
    process.env.API_KEY = 'secret-token';
    botState.status = 'ready';

    const res = await request(app)
      .get('/api/status')
      .set('Authorization', 'bearer secret-token');

    expect(res.status).toBe(200);
  });
});
