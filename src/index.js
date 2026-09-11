require('dotenv').config();

const { Client, Events, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const express = require('express');
const path = require('node:path');

function readToken(name) {
  let value = process.env[name]?.trim();
  if (!value) {
    return undefined;
  }

  value = value.replace(/^['"]|['"]$/g, '').trim();
  value = value.replace(/^Bot\s+/i, '').replace(/,\s*$/, '').trim();
  return value;
}

const botTokens = Array.from({ length: 5 }, (_, index) => ({
  number: index + 1,
  token: readToken(`BOT_TOKEN_${index + 1}`),
}));

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check this bot\'s connection.'),
].map((command) => command.toJSON());

const clients = [];
const app = express();
const port = Number(process.env.PORT) || 10000;
const adminToken = readToken('WEB_ADMIN_TOKEN');

app.use(express.json({ limit: '16kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

function isAuthorized(request) {
  const authorization = request.headers.authorization || '';
  return Boolean(adminToken) && authorization === `Bearer ${adminToken}`;
}

app.get('/health', (request, response) => {
  response.json({ ok: true, onlineBots: clients.filter((client) => client.isReady()).length });
});

app.get('/api/bots', (request, response) => {
  response.json(clients.map((client) => ({
    number: client.botNumber,
    online: client.isReady(),
    tag: client.user?.tag || null,
  })));
});

app.post('/api/broadcast', async (request, response) => {
  if (!isAuthorized(request)) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  const { botNumbers, channelId, content } = request.body || {};
  if (!Array.isArray(botNumbers) || !botNumbers.length || !/^\d{17,20}$/.test(String(channelId)) || typeof content !== 'string' || !content.trim() || content.length > 2000) {
    return response.status(400).json({ error: 'Provide botNumbers, a Discord channelId, and content up to 2000 characters.' });
  }

  const selected = clients.filter((client) => botNumbers.includes(client.botNumber) && client.isReady());
  const results = await Promise.all(selected.map(async (client) => {
    try {
      const channel = await client.channels.fetch(channelId);
      if (!channel?.isTextBased() || typeof channel.send !== 'function') {
        throw new Error('Channel is not a writable text channel.');
      }
      await channel.send({ content: content.trim() });
      return { number: client.botNumber, sent: true };
    } catch (error) {
      return { number: client.botNumber, sent: false, error: error.message };
    }
  }));

  return response.json({ results });
});

app.listen(port, () => console.log(`Web dashboard listening on port ${port}.`));

async function createBot({ number, token }) {
  if (!token) {
    console.warn(`Bot ${number}: BOT_TOKEN_${number} is missing; skipped.`);
    return false;
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });
  client.botNumber = number;

  client.once(Events.ClientReady, async (readyClient) => {
    try {
      await readyClient.application.commands.set(commands);
      console.log(`Bot ${number}: online as ${readyClient.user.tag}`);
    } catch (error) {
      console.error(`Bot ${number}: logged in, but command registration failed.`, error);
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand() || interaction.commandName !== 'ping') {
      return;
    }

    await interaction.reply(`Pong from bot ${number}.`);
  });

  clients.push(client);
  try {
    await client.login(token);
    return true;
  } catch (error) {
    console.error(`Bot ${number}: login failed for a ${token.length}-character value.`, error.message);
    client.destroy();
    return false;
  }
}

(async () => {
  const results = await Promise.all(botTokens.map(createBot));
  const successfulLogins = results.filter(Boolean).length;

  if (successfulLogins === 0) {
    console.error('No bots started. In Render, set each variable to the fresh token value from that application\'s Bot page.');
    process.exitCode = 1;
  } else {
    console.log(`${successfulLogins} of ${botTokens.length} bot(s) logged in successfully.`);
  }
})();

async function shutdown(signal) {
  console.log(`Received ${signal}; logging out bots.`);
  await Promise.allSettled(clients.map((client) => client.destroy()));
  process.exit(0);
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
