import request from 'supertest';
import { app } from '../server';
import { botState } from '../state';
import { client } from '../../services/whatsapp';

jest.mock('../../services/whatsapp', () => ({
  client: { sendMessage: jest.fn() },
  MessageMedia: {},
}));

const mockClient = client as jest.Mocked<typeof client>;

beforeEach(() => {
  botState.status = 'ready';
  (mockClient.sendMessage as jest.Mock).mockResolvedValue({});
});

describe('POST /api/messages/send', () => {
  it('returns 503 when bot is not ready', async () => {
    botState.status = 'disconnected';

    const res = await request(app)
      .post('/api/messages/send')
      .send({ to: '5511991110001', text: 'hello' });

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('Bot not ready');
  });

  it('returns 400 when to is missing', async () => {
    const res = await request(app)
      .post('/api/messages/send')
      .send({ text: 'hello' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/to/);
  });

  it('returns 400 when text is missing', async () => {
    const res = await request(app)
      .post('/api/messages/send')
      .send({ to: '5511991110001' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when body is empty', async () => {
    const res = await request(app).post('/api/messages/send').send({});

    expect(res.status).toBe(400);
  });

  it('appends @c.us to plain phone number', async () => {
    const res = await request(app)
      .post('/api/messages/send')
      .send({ to: '5511991110001', text: 'hello' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.to).toBe('5511991110001@c.us');
    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      '5511991110001@c.us',
      'hello',
    );
  });

  it('uses chat id as-is when it already contains @', async () => {
    const res = await request(app)
      .post('/api/messages/send')
      .send({ to: '120363000000000001@g.us', text: 'group message' });

    expect(res.status).toBe(200);
    expect(res.body.to).toBe('120363000000000001@g.us');
    expect(mockClient.sendMessage).toHaveBeenCalledWith(
      '120363000000000001@g.us',
      'group message',
    );
  });

  it('returns 500 when sendMessage throws', async () => {
    (mockClient.sendMessage as jest.Mock).mockRejectedValue(
      new Error('WA error'),
    );

    const res = await request(app)
      .post('/api/messages/send')
      .send({ to: '5511991110001', text: 'hello' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to send message');
  });
});
