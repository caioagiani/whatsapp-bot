export const mockContacts = [
  {
    id: { _serialized: '5511991110001@c.us' },
    name: 'Alice Silva',
    pushname: 'Alice',
    number: '5511991110001',
    isGroup: false,
    isMyContact: true,
  },
  {
    id: { _serialized: '5511991110002@c.us' },
    name: 'Bob Santos',
    pushname: 'Bob',
    number: '5511991110002',
    isGroup: false,
    isMyContact: false,
  },
  {
    id: { _serialized: '5511991110003@c.us' },
    name: null,
    pushname: 'Carlos',
    number: '5511991110003',
    isGroup: false,
    isMyContact: true,
  },
  {
    id: { _serialized: '120363000000000001@g.us' },
    name: 'Dev Group',
    pushname: '',
    number: '',
    isGroup: true,
    isMyContact: false,
  },
];

export const mockGroups = [
  {
    id: { _serialized: '120363000000000001@g.us' },
    name: 'Dev Team',
    isGroup: true,
    participants: [
      {
        id: { _serialized: '5511991110001@c.us', user: '5511991110001' },
        isAdmin: true,
        isSuperAdmin: false,
      },
      {
        id: { _serialized: '5511991110002@c.us', user: '5511991110002' },
        isAdmin: false,
        isSuperAdmin: false,
      },
    ],
  },
  {
    id: { _serialized: '120363000000000002@g.us' },
    name: 'Marketing',
    isGroup: true,
    participants: [
      {
        id: { _serialized: '5511991110003@c.us', user: '5511991110003' },
        isAdmin: true,
        isSuperAdmin: true,
      },
    ],
  },
];

export const mockNonGroup = {
  id: { _serialized: '5511991110001@c.us' },
  name: 'Alice Silva',
  isGroup: false,
  participants: [],
};
