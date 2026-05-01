export type BotStatus =
  | 'initializing'
  | 'qr'
  | 'authenticated'
  | 'ready'
  | 'disconnected';

class BotState {
  status: BotStatus = 'initializing';
  qr: string | null = null;
  botName: string | null = null;
}

export const botState = new BotState();
