import { Router } from 'express';
import { botState } from '../state';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    status: botState.status,
    name: botState.botName,
    qr: botState.status === 'qr' ? botState.qr : undefined,
  });
});

export default router;
