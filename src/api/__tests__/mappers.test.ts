import type { Message } from 'whatsapp-web.js';
import { messageIdOf, toMessageRow } from '../../sync/mappers';

const msg = (id: unknown, extra = {}) =>
  ({
    id,
    fromMe: false,
    from: '123@lid',
    to: 'me@c.us',
    body: 'hi',
    type: 'chat',
    timestamp: 1,
    hasMedia: false,
    ...extra,
  } as unknown as Message);

describe('messageIdOf', () => {
  it('uses _serialized when present', () => {
    expect(messageIdOf(msg({ _serialized: 'false_a@c.us_X' }))).toBe(
      'false_a@c.us_X',
    );
  });

  it('accepts the $1 key used by newer WhatsApp Web builds', () => {
    expect(messageIdOf(msg({ $1: 'false_a@c.us_X' }))).toBe('false_a@c.us_X');
  });

  it('drops the direction suffix newer builds add to sent messages', () => {
    expect(messageIdOf(msg({ $1: 'true_a@lid_3EB0X_out' }))).toBe(
      'true_a@lid_3EB0X',
    );
    expect(messageIdOf(msg({ _serialized: 'false_g@g.us_Y_p@lid' }))).toBe(
      'false_g@g.us_Y_p@lid',
    );
  });

  it('rebuilds the id when _serialized is missing', () => {
    expect(
      messageIdOf(
        msg({ fromMe: true, remote: { _serialized: 'a@c.us' }, id: 'X' }),
      ),
    ).toBe('true_a@c.us_X');
    expect(
      messageIdOf(
        msg({ fromMe: false, remote: 'g@g.us', id: 'Y', participant: 'p@lid' }),
      ),
    ).toBe('false_g@g.us_Y_p@lid');
  });

  it('returns null when the key is unusable', () => {
    expect(messageIdOf(msg(undefined))).toBeNull();
    expect(messageIdOf(msg({ fromMe: false }))).toBeNull();
  });

  it('feeds toMessageRow', () => {
    const row = toMessageRow(msg({ fromMe: false, remote: 'a@lid', id: 'Z' }));
    expect(row.id).toBe('false_a@lid_Z');
    expect(row.chatId).toBe('a@lid');
  });
});
