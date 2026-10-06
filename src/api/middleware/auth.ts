import type { Request, Response, NextFunction } from 'express';

export const apiKeyAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    next();
    return;
  }

  // ?key= lets <img>/<audio> tags and the web UI authenticate without headers.
  const provided =
    req.headers.authorization?.replace(/^Bearer /i, '') ||
    (typeof req.query.key === 'string' ? req.query.key : undefined);
  if (provided !== apiKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
};
