# HTTP API

Base URL: `http://localhost:3000` (`API_PORT`).

## Authentication

Set `API_KEY` in `.env` to require it; leave empty for an open API.

```
Authorization: Bearer <api-key>
```

`?key=<api-key>` is also accepted (used by `<img>`/`<audio>` tags and the WebSocket).

## Endpoints

### Status

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/status` | `status` (`initializing`, `qr`, `authenticated`, `ready`, `disconnected`), `name`, `syncing`, and `qr` while pairing |

### Chats & messages (local store)

Served from SQLite, so they work read-only while WhatsApp is offline.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/chats` | Newest first, pinned on top. `cursor`, `limit` (≤100), `q`, `filter=unread\|groups`, `archived=1` |
| `GET` | `/api/chats/:id` | Chat details (+ group participants when connected) |
| `GET` | `/api/chats/:id/messages` | Chronological page + `nextCursor` for older (`before`, `limit`). Pulls older history from WhatsApp on demand |
| `POST` | `/api/chats/:id/messages` | Send. JSON or multipart: `text`, `file`, `voice=1`, `quotedId`. `403` when the chat is read-only for the bot |
| `POST` | `/api/chats/:id/seen` | Mark as read |
| `POST` | `/api/chats/:id/presence` | `{"state": "typing" \| "recording" \| "stop"}` |
| `GET` | `/api/chats/:id/avatar` | Profile picture (disk cache, 24h) |
| `GET` | `/api/messages/:id/media` | Media, downloaded once then cached (`?download=1`) |
| `GET` | `/api/search?q=` | Full-text search (FTS5, accent-insensitive, prefix) |
| `GET` | `/api/directory?q=` | Saved contacts |

Cursors are opaque; pass back the `nextCursor` you received.

### Live (WhatsApp)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/contacts` | Contacts, `?page=&limit=` |
| `GET` | `/api/contacts/search?q=` | Search contacts by name or number |
| `GET` | `/api/groups` | Groups, `?page=&limit=` |
| `GET` | `/api/groups/:id` | Group + participants with admin flags |
| `POST` | `/api/messages/send` | `{"to": "5511999999999", "text": "Hello!"}` |

### WebSocket

`ws://localhost:3000/ws` pushes `{ type, data }`:

| Type | Data |
|------|------|
| `status` | Same shape as `/api/status` |
| `message.new` / `message.update` | Message (or a partial like `{ id, chatId, ack }`) |
| `chat.update` / `chat.remove` | Chat / `{ id }` |
| `sync` | `{ state: "started" \| "done" }` |

## Examples

```bash
curl localhost:3000/api/status

curl 'localhost:3000/api/chats?filter=unread&limit=20'

curl -X POST localhost:3000/api/chats/5511999999999@c.us/messages \
  -H 'Content-Type: application/json' -d '{"text": "Hello!"}'

curl -X POST localhost:3000/api/chats/5511999999999@c.us/messages \
  -F file=@photo.jpg -F text='caption'
```

An [Insomnia](../insomnia.json) collection is included.
