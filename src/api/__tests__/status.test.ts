import request from 'supertest';
import { app } from '../server';
import { botState } from '../state';

jest.mock('../../services/whatsapp', () => ({
  client: {},
  MessageMedia: {},
}));

describe('GET /api/status', () => {
  it('returns initializing status on startup', async () => {
    botState.status = 'initializing';
    botState.qr = null;
    botState.botName = null;

    const res = await request(app).get('/api/status');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('initializing');
    expect(res.body.name).toBeNull();
    expect(res.body.qr).toBeUndefined();
  });

  it('returns qr and qr data when awaiting scan', async () => {
    botState.status = 'qr';
    botState.qr = 'mock-qr-string';
    botState.botName = null;

    const res = await request(app).get('/api/status');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('qr');
    expect(res.body.qr).toBe('mock-qr-string');
  });

  it('returns ready status with bot name when connected', async () => {
    botState.status = 'ready';
    botState.qr = null;
    botState.botName = 'MyBot';

    const res = await request(app).get('/api/status');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.name).toBe('MyBot');
    expect(res.body.qr).toBeUndefined();
  });

  it('returns disconnected status', async () => {
    botState.status = 'disconnected';
    botState.botName = null;

    const res = await request(app).get('/api/status');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('disconnected');
  });
});
