require('dotenv').config();

const { Client, Events, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');

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

async function createBot({ number, token }) {
  if (!token) {
    console.warn(`Bot ${number}: BOT_TOKEN_${number} is missing; skipped.`);
    return false;
  }

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

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
