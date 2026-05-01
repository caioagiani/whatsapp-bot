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

  const provided = req.headers.authorization?.replace('Bearer ', '');
  if (provided !== apiKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
};
