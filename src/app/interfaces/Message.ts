interface IMessage {
  id: {
    participant: string;
  };
  to: string;
  from: string;
  body: string;
  type: string;
  isForwarded: boolean;
  broadcast: boolean;
  hasMedia: boolean;
  hasQuotedMsg: boolean;
  timestamp: number;
  getChat: () => any;
  getContact: () => any;
  reply: (arg0: string) => void;
}

export { IMessage };
