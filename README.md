# Five Discord Application Bots

This project runs up to five compliant Discord **application bots** from one Node.js process. It does not automate user accounts or use self-bots.

## Requirements

- Node.js 18.17 or newer
- Five Discord applications created in the [Discord Developer Portal](https://discord.com/developers/applications)

## Setup

1. Create five applications in the Developer Portal.
2. For each application, open **Bot**, create/reset the bot user, and copy its fresh bot token.
3. Use **OAuth2 > URL Generator** for each application with the `bot` and `applications.commands` scopes. Grant only the permissions the bot needs; this starter uses no privileged intents.
4. Copy `.env.example` to `.env`.
5. Put each application bot token in its matching `BOT_TOKEN_1` through `BOT_TOKEN_5` entry.
6. Install dependencies and start the service:

```powershell
npm install
npm start
```

Each online bot registers `/ping`. Run `/ping` in a server where that bot was invited.

## Security

Never commit `.env`, paste tokens into chat, or put tokens in source code. If a token is exposed, reset it immediately in the Developer Portal.
