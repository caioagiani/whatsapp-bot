import { spawn } from 'child_process';
import { existsSync, mkdirSync, statSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import axios from 'axios';
import ffmpegPath from 'ffmpeg-static';
import { eq } from 'drizzle-orm';
import { client } from './whatsapp';
import { db } from '../db';
import { messages } from '../db/schema';
import { getMessage } from '../sync/store';

const DATA_DIR = process.env.MEDIA_DIR || resolve(__dirname, '..', 'data');
const MEDIA_DIR = resolve(DATA_DIR, 'media');
const AVATAR_DIR = resolve(DATA_DIR, 'avatars');
const AVATAR_TTL_MS = 24 * 60 * 60 * 1000;
const NO_AVATAR_TTL_MS = 6 * 60 * 60 * 1000;

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/webm': 'webm',
  'application/pdf': 'pdf',
};

const safeName = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, '_');
const extOf = (mime: string) =>
  EXT[mime.split(';')[0].trim()] || mime.split('/')[1]?.split(';')[0] || 'bin';

export const saveMedia = (
  messageId: string,
  mime: string,
  data: Buffer,
): string => {
  mkdirSync(MEDIA_DIR, { recursive: true });
  const path = resolve(MEDIA_DIR, `${safeName(messageId)}.${extOf(mime)}`);
  writeFileSync(path, data);
  return path;
};

const downloads = new Map<string, Promise<string | null>>();

/** Resolve a message's media to a local file, downloading it once. */
export const getMediaFile = (messageId: string): Promise<string | null> => {
  const row = getMessage(messageId);
  if (!row || !row.hasMedia) return Promise.resolve(null);
  if (row.mediaPath && existsSync(row.mediaPath)) {
    return Promise.resolve(row.mediaPath);
  }

  const pending = downloads.get(messageId);
  if (pending) return pending;

  const job = (async () => {
    const msg = await client.getMessageById(messageId);
    const media = msg ? await msg.downloadMedia() : null;
    if (!media?.data) return null;

    const path = saveMedia(
      messageId,
      media.mimetype,
      Buffer.from(media.data, 'base64'),
    );
    db.update(messages)
      .set({
        mediaPath: path,
        mediaMime: media.mimetype,
        mediaFilename: media.filename || row.mediaFilename,
      })
      .where(eq(messages.id, messageId))
      .run();
    return path;
  })().finally(() => downloads.delete(messageId));

  downloads.set(messageId, job);
  return job;
};

/** Browsers record webm/opus; WhatsApp voice notes must be ogg/opus. */
export const toVoiceNote = (input: Buffer, mime: string): Promise<Buffer> => {
  if (mime.startsWith('audio/ogg')) return Promise.resolve(input);
  if (!ffmpegPath) return Promise.reject(new Error('ffmpeg not available'));

  return new Promise((done, fail) => {
    const ff = spawn(ffmpegPath as string, [
      '-hide_banner',
      '-loglevel',
      'error',
      '-i',
      'pipe:0',
      '-vn',
      '-ac',
      '1',
      '-ar',
      '48000',
      '-c:a',
      'libopus',
      '-b:a',
      '32k',
      '-f',
      'ogg',
      'pipe:1',
    ]);
    const chunks: Buffer[] = [];
    let stderr = '';
    ff.stdout.on('data', (c: Buffer) => chunks.push(c));
    ff.stderr.on('data', (c: Buffer) => (stderr += c.toString()));
    ff.on('error', fail);
    ff.on('close', (code) =>
      code === 0
        ? done(Buffer.concat(chunks))
        : fail(new Error(`ffmpeg exited ${code}: ${stderr}`)),
    );
    ff.stdin.end(input);
  });
};

/**
 * Profile pictures come as short-lived CDN URLs, so cache the bytes on disk.
 * An empty file marks "no picture" to avoid re-asking WhatsApp every render.
 */
export const getAvatarFile = async (id: string): Promise<string | null> => {
  mkdirSync(AVATAR_DIR, { recursive: true });
  const path = resolve(AVATAR_DIR, `${safeName(id)}.jpg`);

  if (existsSync(path)) {
    const stat = statSync(path);
    const ttl = stat.size > 0 ? AVATAR_TTL_MS : NO_AVATAR_TTL_MS;
    if (Date.now() - stat.mtimeMs < ttl) {
      return stat.size > 0 ? path : null;
    }
  }

  // Let lookup errors propagate: only a successful "no picture" answer is
  // cached, otherwise a transient failure would hide the avatar for hours.
  const url = await client.getProfilePicUrl(id);

  if (!url) {
    writeFileSync(path, '');
    return null;
  }

  const res = await axios.get<ArrayBuffer>(url, {
    responseType: 'arraybuffer',
    timeout: 10_000,
  });
  writeFileSync(path, Buffer.from(res.data));
  return path;
};
