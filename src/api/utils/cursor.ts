// Opaque keyset cursors: base64url(JSON array of the sort-key values).
export const encodeCursor = (values: (string | number)[]): string =>
  Buffer.from(JSON.stringify(values)).toString('base64url');

export const decodeCursor = <T extends (string | number)[]>(
  cursor: unknown,
  arity: number,
): T | null => {
  if (typeof cursor !== 'string' || !cursor) return null;
  try {
    const values = JSON.parse(Buffer.from(cursor, 'base64url').toString());
    return Array.isArray(values) && values.length === arity
      ? (values as T)
      : null;
  } catch {
    return null;
  }
};

export const parseLimit = (value: unknown, fallback: number, max = 100) =>
  Math.min(max, Math.max(1, parseInt(String(value ?? ''), 10) || fallback));
