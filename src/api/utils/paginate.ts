import type { Request } from 'express';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

export function parsePagination(req: Request): { page: number; limit: number } {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(
      1,
      parseInt(String(req.query.limit || String(DEFAULT_LIMIT)), 10) ||
        DEFAULT_LIMIT,
    ),
  );
  return { page, limit };
}

export function paginate<T>(
  items: T[],
  page: number,
  limit: number,
): PaginatedResult<T> {
  const total = items.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = items.slice(start, start + limit);

  return { data, pagination: { total, page, limit, pages } };
}
