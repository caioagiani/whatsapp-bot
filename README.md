<!--
/*
 * Thanks for downloading this project! If you have any ideas, tweaks, etc...
 * fork the repository and create a Pull Request.
 */
-->

<p align="center">
  <img 
    width="100" 
    height="80%" 
    src=".github/assets/logo.png" 
    alt="WhatsApp BOT @caioagiani"
    title="WhatsApp BOT @caioagiani"
  /></a>
</p>

<h1 align="center">WhatsApp Bot</h1>

<p align="center">
  <strong>A powerful, extensible WhatsApp bot built with TypeScript — with a REST API, command system and in-memory cache</strong>
</p>

<p align="center">
  <img alt="GitHub language count" src="https://img.shields.io/github/languages/count/caioagiani/whatsapp-bot" />
  <img alt="GitHub top language" src="https://img.shields.io/github/languages/top/caioagiani/whatsapp-bot" />
  <img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/caioagiani/whatsapp-bot" />
  <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/caioagiani/whatsapp-bot" />
  <img alt="License" src="https://img.shields.io/badge/license-GNU%20AGPL-blue.svg" />
</p>

---

## 📋 Overview

This application is a WhatsApp client that connects to WhatsApp Web using **Puppeteer**, enabling real-time automation, command execution and programmatic control via a built-in **HTTP REST API**. Built with TypeScript and following modern software architecture principles.

### ✨ Key Features

- 🤖 **Command-based Architecture** - Extensible command system with interface-based design
- 🌐 **HTTP REST API** - Control the bot and query data programmatically
- 💻 **Web Interface** - WhatsApp Web–style UI: chats, groups, emoji, media, voice notes, replies, search
- 🗄️ **Local Persistence** - Messages synced to SQLite via WhatsApp events; history survives disconnects
- ⚡ **Realtime** - WebSocket push for new messages, read receipts and chat updates
- ⚡ **In-memory Cache** - Contacts and chats cached with configurable TTL
- 🔄 **Alias Support** - Multiple names for the same command
- 🛡️ **Error Handling** - Robust error handling with user-friendly messages
- 📝 **Type Safety** - Full TypeScript implementation
- 🎯 **Easy to Extend** - Add new commands in minutes
- 🔐 **Group Validation** - Built-in group-only command support
- 💬 **Real-time Responses** - Typing indicators and instant feedback
- 🔒 **Graceful Shutdown** - Clean SIGTERM/SIGINT handling

---

## 🚀 Available Commands

| Command | Aliases | Description |
|---------|---------|-------------|
| `!help` | `!ajuda`, `!comandos`, `!commands` | Shows all available commands with descriptions |
| `!cotacao` | `!moeda`, `!dolar`, `!bitcoin` | Get current currency exchange rates (USD, BTC, EUR) |
| `!cep <code>` | - | Search Brazilian postal code information |
| `!perfil @user` | `!foto`, `!avatar`, `!pic` | Get user's profile picture |
| `!mencionar` | `!everyone`, `!all`, `!todos` | Mention all group members (admin only) |
| `!sms @user` | - | Send SMS to mentioned user |

> **Note:** All commands start with `!` prefix

---

## 🌐 HTTP REST API

The bot exposes a REST API on port `3000` (configurable) for programmatic control.

### Authentication

Set `API_KEY` in `.env` to enable Bearer token authentication. If not set, the API is open.

```
Authorization: Bearer <your-api-key>
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/status` | Bot connection status + QR code when pending |
| `GET` | `/api/contacts` | List all contacts (paginated) |
| `GET` | `/api/contacts/search?q=` | Search contacts by name or number |
| `GET` | `/api/groups` | List all groups (paginated) |
| `GET` | `/api/groups/:id` | Group details + participants with admin flags |
| `POST` | `/api/messages/send` | Send a message to a contact or group |
| `GET` | `/api/messages/:id/media` | Message media (downloaded once, cached on disk; `?download=1`) |
| `GET` | `/api/chats` | Chats from the local store — keyset pagination (`cursor`), `q`, `filter=unread\|groups`, `archived=1` |
| `GET` | `/api/chats/:id` | Chat details (+ group participants when connected) |
| `GET` | `/api/chats/:id/messages` | Messages, newest page first (`before` cursor); pulls older history from WhatsApp on demand |
| `POST` | `/api/chats/:id/messages` | Send text / file / voice note (JSON or multipart: `text`, `file`, `voice=1`, `quotedId`) |
| `POST` | `/api/chats/:id/seen` | Mark chat as read |
| `POST` | `/api/chats/:id/presence` | `typing` / `recording` / `stop` |
| `GET` | `/api/chats/:id/avatar` | Profile picture (cached on disk for 24h) |
| `GET` | `/api/search?q=` | Full-text message search (SQLite FTS5, accent-insensitive, prefix match) |
| `GET` | `/api/directory?q=` | Saved contacts from the local store |
| `WS` | `/ws` | Realtime events: `status`, `message.new`, `message.update`, `chat.update`, `chat.remove`, `sync` |

When `API_KEY` is set, `?key=<api-key>` is also accepted (used by `<img>`/`<audio>` tags and the WebSocket).

### Pagination

`/api/contacts` and `/api/groups` support `?page=1&limit=20` (max limit: 100).

```json
{
  "contacts": [...],
  "pagination": {
    "total": 120,
    "page": 1,
    "limit": 20,
    "pages": 6
  }
}
```

### Examples

**Get bot status:**
```bash
curl http://localhost:3000/api/status
# {"status":"ready","name":"MyBot","qr":null}
```

**List groups:**
```bash
curl http://localhost:3000/api/groups?page=1&limit=10
```

**Send a message:**
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -d '{"to": "5511999999999", "text": "Hello!"}'
```

> **Tip:** Import `insomnia.json` from the project root into Insomnia for a ready-to-use collection.

---

## 📦 Installation

### Prerequisites

- Node.js 16+
- npm
- WhatsApp account

### Setup

```bash
# Clone the repository
git clone git@github.com:caioagiani/whatsapp-bot.git
cd whatsapp-bot

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your settings

# Start the bot
npm run dev
```

### Web Interface

```bash
npm run web:install   # once
npm run web:build     # builds web/dist, served by the bot at http://localhost:3000
npm run web:dev       # or: Vite dev server with HMR on :5173 (proxies /api and /ws to the bot)
```

The UI reads chats and messages from the local SQLite store, so history stays browsable (read-only) while WhatsApp is disconnected. When the bot needs pairing, the UI shows the QR code.

### First Run

1. When you start the bot for the first time, a QR code will appear in your terminal
2. Open WhatsApp on your phone
3. Go to **Settings** → **Linked Devices** → **Link a Device**
4. Scan the QR code displayed in your terminal
5. Wait for the authentication to complete

✅ Your bot is now connected. The HTTP API is available at `http://localhost:3000`.

---

## 🏗️ Architecture

### Project Structure

```
src/
├── api/
│   ├── middleware/
│   │   └── auth.ts             # Bearer token auth
│   ├── routes/
│   │   ├── contacts.ts         # GET /api/contacts
│   │   ├── groups.ts           # GET /api/groups
│   │   ├── messages.ts         # POST /api/messages/send
│   │   └── status.ts           # GET /api/status
│   ├── utils/
│   │   ├── cache.ts            # In-memory TTL cache
│   │   └── paginate.ts         # Pagination helper
│   ├── server.ts               # Express setup
│   └── state.ts                # Bot state tracker
├── app/
│   ├── commands/               # Command implementations
│   │   ├── CepCommand.ts
│   │   ├── EconomyCommand.ts
│   │   ├── HelpCommand.ts
│   │   ├── ProfileCommand.ts
│   │   ├── QuoteCommand.ts
│   │   ├── SmsCommand.ts
│   │   └── index.ts
│   ├── interfaces/
│   │   ├── ICommand.ts
│   │   └── Cep.ts
│   └── utils/
│       ├── BaseCommand.ts
│       └── CommandDispatcher.ts
├── config/
│   └── integrantes.json        # Admin users (gitignored)
├── data/                       # WhatsApp session data (gitignored)
├── services/
│   ├── mobizon.ts              # SMS service
│   ├── shutdown.ts             # Graceful shutdown
│   └── whatsapp.ts             # WhatsApp client
└── index.ts
```

### Persistence & Sync

WhatsApp Web has no real pagination: `getChats()` loads everything through Puppeteer and `fetchMessages` only returns the newest N. So the bot keeps a local SQLite store (Drizzle ORM, WAL mode) fed by client events:

- `message_create`, `message_ack`, `message_revoke_everyone`, `message_edit`, `unread_count`, `chat_archived`, `chat_removed` → upserts + WebSocket broadcast
- On `ready`, a backfill stores all chats and the latest `SYNC_BACKFILL_MESSAGES` of the `SYNC_BACKFILL_CHATS` most recent chats
- Scrolling past the stored history pulls older messages from WhatsApp on demand (`history_complete` marks when it runs out)
- Indexes: `messages(chat_id, timestamp)` and `chats(archived, pinned, last_message_at)` back the keyset cursors; `messages_fts` (FTS5 + triggers) backs search
- Media is downloaded lazily on first view and stored under `src/data/media`; voice notes recorded in the browser are converted to ogg/opus with `ffmpeg-static`

Schema changes: edit `src/db/schema.ts`, run `npm run db:generate`; migrations apply automatically on startup.

### Cache

`getContacts()` and `getChats()` are expensive Puppeteer calls (~500ms). Results are cached in memory for 30 seconds (configurable via `CACHE_TTL_MS`). Cache is cleared automatically on disconnect.

---

## 🔧 Configuration

### Environment Variables

```env
# HTTP API
API_PORT=3000
API_KEY=                        # Bearer token (leave empty to disable auth)

# Bot owner — receives a message when the bot connects
# Falls back to the first admin in integrantes.json if not set
BOT_OWNER_PHONE=

# Cache TTL in milliseconds (default: 30000)
CACHE_TTL_MS=30000

# Local store (defaults: src/data/whatsapp.db, src/data)
DB_PATH=
MEDIA_DIR=

# Backfill on connect (defaults: 30 chats × 50 messages)
SYNC_BACKFILL_CHATS=30
SYNC_BACKFILL_MESSAGES=50

# Mobizon SMS (optional — required for !sms command)
MOBIZON_URL_SRV=https://api.mobizon.com.br
MOBIZON_API_KEY=
```

### Admin Configuration

For admin-only commands (like `!mencionar`), configure authorized users in `src/config/integrantes.json` (gitignored):

```json
{
  "company": [
    {
      "numero": "5511999999999",
      "admin": true,
      "nome": "Your Name",
      "cargo": "Admin"
    }
  ]
}
```

---

## 🔧 Adding New Commands

```typescript
// src/app/commands/HelloCommand.ts
import { BaseCommand } from '../utils/BaseCommand';
import type { Message } from 'whatsapp-web.js';

export class HelloCommand extends BaseCommand {
  name = 'hello';
  description = 'Responds with a greeting';
  aliases = ['hi', 'ola'];

  async execute(message: Message, args: string[]): Promise<Message> {
    await this.sendTyping(message);
    const name = args.join(' ') || 'friend';
    return message.reply(`👋 Hello, ${name}!`);
  }
}
```

Then register in `src/app/commands/index.ts`:

```typescript
commandDispatcher.register(new HelloCommand());
```

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run linter
npm run lint

# Development mode with auto-reload
npm run dev
```

Tests use **Jest** + **Supertest** and cover all API endpoints, pagination, authentication and error paths (46 tests).

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes using [Conventional Commits](https://www.conventionalcommits.org/)
4. Push to the branch and open a Pull Request

---

## 📝 License

Copyright © 2022-2026 [Caio Agiani](https://github.com/caioagiani)

This project is licensed under the [GNU AGPL License](./LICENSE).

---

## ⚠️ Disclaimer

This project is **not affiliated, associated, authorized, endorsed by, or in any way officially connected** with WhatsApp or any of its subsidiaries or affiliates.

**Use this bot responsibly and in accordance with WhatsApp's Terms of Service.**

---

### 👥 Contributors

<a href="https://github.com/caioagiani/whatsapp-bot/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=caioagiani/whatsapp-bot" />
</a>

## 🙏 Acknowledgments

- [@pedroslopez](https://github.com/pedroslopez) - whatsapp-web.js library
- All contributors who have helped improve this project

---

## 📞 Contact

- **Author:** Caio Agiani
- **LinkedIn:** [linkedin.com/in/caioagiani](https://www.linkedin.com/in/caioagiani/)
- **GitHub:** [@caioagiani](https://github.com/caioagiani)

---

<p align="center">Made with ❤️ by <a href="https://github.com/caioagiani">Caio Agiani</a></p>
