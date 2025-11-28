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
    src="https://github.com/caioagiani/whatsapp-bot/blob/main/.github/assets/logo.png" 
    alt="WhatsApp BOT @caioagiani"
    title="WhatsApp BOT @caioagiani"
  /></a>
</p>

<h1 align="center">WhatsApp Bot</h1>

<p align="center">
  <strong>A powerful, extensible WhatsApp bot built with TypeScript and modern architecture</strong>
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

This application is a WhatsApp client that connects to WhatsApp Web using **Puppeteer**, enabling real-time automation and command execution. Built with TypeScript and following modern software architecture principles, it provides a robust and scalable foundation for WhatsApp automation.

### ✨ Key Features

- 🤖 **Command-based Architecture** - Extensible command system with interface-based design
- 🔄 **Alias Support** - Multiple names for the same command
- 🛡️ **Error Handling** - Robust error handling with user-friendly messages
- 📝 **Type Safety** - Full TypeScript implementation
- 🎯 **Easy to Extend** - Add new commands in minutes
- 🔐 **Group Validation** - Built-in group-only command support
- 💬 **Real-time Responses** - Typing indicators and instant feedback

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

## 📦 Installation

### Prerequisites

- Node.js 16+ 
- npm or yarn
- WhatsApp account

### Setup

```bash
# Clone the repository
git clone git@github.com:caioagiani/whatsapp-bot.git
cd whatsapp-bot

# Install dependencies
npm install --legacy-peer-deps
# or
yarn install

# Configure environment variables
cp .env.example .env
# Edit .env and add your Mobizon API credentials (optional, for SMS feature)

# Start the bot
npm run dev
# or
yarn dev
```

### First Run

1. When you start the bot for the first time, a QR code will appear in your terminal
2. Open WhatsApp on your phone
3. Go to **Settings** → **Linked Devices** → **Link a Device**
4. Scan the QR code displayed in your terminal
5. Wait for the authentication to complete

✅ Your bot is now connected and ready to receive commands!

---

## 🏗️ Architecture

This project follows a **clean, interface-based architecture** that makes it easy to maintain and extend.

### Project Structure

```
src/
├── app/
│   ├── commands/           # All command implementations
│   │   ├── CepCommand.ts
│   │   ├── EconomyCommand.ts
│   │   ├── ProfileCommand.ts
│   │   ├── QuoteCommand.ts
│   │   ├── SmsCommand.ts
│   │   └── index.ts        # Command registration
│   ├── interfaces/         # TypeScript interfaces
│   │   ├── ICommand.ts     # Base command interface
│   │   └── Cep.ts
│   └── utils/              # Utility classes
│       ├── BaseCommand.ts  # Abstract base class for commands
│       └── CommandDispatcher.ts
├── config/                 # Configuration files
├── data/                   # WhatsApp session data
├── services/               # External services
│   ├── whatsapp.ts        # WhatsApp client setup
│   └── mobizon.ts         # SMS service
└── index.ts               # Application entry point
```

### Command System

The bot uses a **modern command pattern** with the following benefits:

- ✅ **Interface-based design** - All commands implement `ICommand`
- ✅ **Base class with helpers** - `BaseCommand` provides common functionality
- ✅ **Automatic registration** - Commands are registered at startup
- ✅ **Alias support** - Multiple names for the same command
- ✅ **Centralized error handling** - Consistent error messages
- ✅ **Type safety** - Full TypeScript support

**📚 [View Technical Documentation](./docs/ARCHITECTURE.md)** for detailed architecture information.

---

## 🔧 Adding New Commands

Creating a new command is simple:

### 1. Create Command File

```typescript
// src/app/commands/HelloCommand.ts
import { BaseCommand } from '../utils/BaseCommand';
import type { Message } from 'whatsapp-web.js';

export class HelloCommand extends BaseCommand {
  name = 'hello';
  description = 'Responds with a greeting';
  aliases = ['hi', 'hey', 'ola'];
  
  async execute(message: Message, args: string[]): Promise<Message> {
    await this.sendTyping(message);
    
    const name = args.join(' ') || 'friend';
    
    return message.reply(`👋 Hello, ${name}! How can I help you?`);
  }
}
```

### 2. Register Command

```typescript
// src/app/commands/index.ts
import { HelloCommand } from './HelloCommand';

export const initializeCommands = (): void => {
  // ... other commands
  commandDispatcher.register(new HelloCommand());
};
```

**That's it!** Your command is now available with all aliases: `!hello`, `!hi`, `!hey`, `!ola`

---

## 🛠️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Mobizon SMS Service (optional)
MOBIZON_URL_SRV=https://api.mobizon.com.br
MOBIZON_API_KEY=your_api_key_here
```

### Group Configuration

For admin-only commands (like `!mencionar`), configure authorized users in:

```
src/config/integrantes.json
```

```json
{
  "company": [
    {
      "numero": "5511999999999",
      "admin": true
    }
  ]
}
```

---

## 📖 Usage Examples

### Get Help
```
User: !help
Bot: 📚 Available Commands

━━━━━━━━━━━━━━━━━━━━

🔹 !help
   Shows all available commands with their descriptions
   Aliases: !ajuda, !comandos, !commands

🔹 !cotacao
   Shows current exchange rates (USD, BTC, EUR)
   Aliases: !moeda, !dolar, !bitcoin

...
```

### Get Currency Rates
```
User: !cotacao
Bot: 💎 Cotação Atual 💰🤑💹

💲 Dólar Americano (USD)
Valor atual: R$ 5.25
Valor mais alto: R$ 5.30
Valor mais baixo: R$ 5.20
...
```

### Search Postal Code
```
User: !cep 01310-100
Bot: 📮 Informações do CEP

CEP: 01310-100
Logradouro: Avenida Paulista
Bairro: Bela Vista
Cidade: São Paulo
UF: SP
```

### Get Profile Picture
```
User: !perfil @John
Bot: 🔍 Buscando foto de perfil...
[Sends profile picture]
```

---

## 🧪 Testing

```bash
# Run linter
npm run lint

# Run in development mode with auto-reload
npm run dev
```

### Manual Testing Checklist

- [ ] `!cotacao` - Returns currency rates
- [ ] `!moeda` - Works as alias for cotacao
- [ ] `!cep 01310-100` - Returns postal code info
- [ ] `!cep` - Returns usage error
- [ ] `!perfil @user` - Returns profile picture (in groups)
- [ ] `!perfil @user` - Returns error (in private chat)
- [ ] `!invalidcommand` - Silently ignored

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Extend `BaseCommand` for new commands
- Add proper error handling
- Include JSDoc comments
- Test your changes thoroughly

---

## 📝 License

Copyright © 2022-2025 [Caio Agiani](https://github.com/caioagiani)

This project is licensed under the [GNU AGPL License](./LICENSE).

---

## ⚠️ Disclaimer

This project is **not affiliated, associated, authorized, endorsed by, or in any way officially connected** with WhatsApp or any of its subsidiaries or affiliates. The official WhatsApp website can be found at https://whatsapp.com.

"WhatsApp" as well as related names, marks, emblems and images are registered trademarks of their respective owners.

**Use this bot responsibly and in accordance with WhatsApp's Terms of Service.**

---

## 🙏 Acknowledgments

Special thanks to:

- [@pedroslopez](https://github.com/pedroslopez) - whatsapp-web.js library
- [@raniellyferreira](https://github.com/raniellyferreira) - Initial contributions
- All contributors who have helped improve this project

---

## 📞 Contact

- **Author:** Caio Agiani
- **LinkedIn:** [linkedin.com/in/caioagiani](https://www.linkedin.com/in/caioagiani/)
- **Email:** caio.agiani14@gmail.com
- **GitHub:** [@caioagiani](https://github.com/caioagiani)

---

## 🌟 Star History

If you find this project useful, please consider giving it a ⭐️!

[![Star History Chart](https://api.star-history.com/svg?repos=caioagiani/whatsapp-bot&type=Date)](https://star-history.com/#caioagiani/whatsapp-bot&Date)

---

<p align="center">Made with ❤️ by <a href="https://github.com/caioagiani">Caio Agiani</a></p>
