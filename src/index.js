require('dotenv').config();

const { Client, Events, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');

const botTokens = Array.from({ length: 5 }, (_, index) => ({
  number: index + 1,
  token: process.env[`BOT_TOKEN_${index + 1}`]?.trim(),
}));

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check this bot\'s connection.'),
].map((command) => command.toJSON());

const clients = [];

function createBot({ number, token }) {
  if (!token) {
    console.warn(`Bot ${number}: BOT_TOKEN_${number} is missing; skipped.`);
    return null;
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

  client.login(token).catch((error) => {
    console.error(`Bot ${number}: login failed. Check its application token.`, error.message);
  });

  clients.push(client);
  return client;
}

for (const bot of botTokens) {
  createBot(bot);
}

if (clients.length === 0) {
  console.error('No bots started. Copy .env.example to .env and add fresh application bot tokens.');
  process.exitCode = 1;
}

async function shutdown(signal) {
  console.log(`Received ${signal}; logging out bots.`);
  await Promise.allSettled(clients.map((client) => client.destroy()));
  process.exit(0);
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
