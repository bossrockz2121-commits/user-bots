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

## Render deployment

This is a Discord background worker, not a web service. The included `render.yaml` expects the Render **Root Directory** to be blank (the repository root), with `npm ci` as the build command and `npm start` as the start command. If configuring the service manually, use those same values. Do not use `node src/src/index.js` or set the Root Directory to `src` while keeping `node src/index.js`.

Add `BOT_TOKEN_1` through `BOT_TOKEN_5` as secret environment variables in Render. Render does not need a port for this worker.

For each application, open **Developer Portal > Application > Bot**, click **Reset Token**, copy the newly generated token, and paste only the token value into the matching Render variable. Do not paste the variable name, `BOT_TOKEN_1=`, an application ID, a client secret, or a user-account token. The service also removes accidental surrounding quotes, a `Bot ` prefix, or a trailing comma. After saving the variables, use **Manual Deploy > Deploy latest commit**.

Before deploying, verify the GitHub repository contains these paths at its top level:

```text
package.json
package-lock.json
src/index.js
render.yaml
```

If the Render service was created manually, update its settings in **Settings > Build & Deploy**, save them, and trigger a new deploy. Existing service settings can override `render.yaml` until the service is recreated from the Blueprint.

## Security

Never commit `.env`, paste tokens into chat, or put tokens in source code. If a token is exposed, reset it immediately in the Developer Portal.
