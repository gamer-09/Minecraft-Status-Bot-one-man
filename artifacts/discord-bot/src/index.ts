import "dotenv/config";
import http from "http";
import { Client, GatewayIntentBits, Collection, Events, Message } from "discord.js";
import { config } from "./config.js";
import { startMonitor } from "./monitor.js";

import * as statusCmd from "./commands/status.js";
import * as ipCmd from "./commands/ip.js";
import * as playersCmd from "./commands/players.js";
import * as pingCmd from "./commands/ping.js";
import * as helpCmd from "./commands/help.js";
import * as setfeedCmd from "./commands/setfeed.js";

const PREFIX = "!";

// Minimal HTTP server so Render's port scan succeeds
const PORT = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot is running.\n");
  })
  .listen(PORT, () => {
    console.log(`Health check server listening on port ${PORT}`);
  });

interface Command {
  name: string;
  description: string;
  execute: (message: Message) => Promise<void>;
}

const commands = new Collection<string, Command>();
const commandList: Command[] = [statusCmd, ipCmd, playersCmd, pingCmd, helpCmd, setfeedCmd];

for (const cmd of commandList) {
  commands.set(cmd.name, cmd);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ Logged in as ${readyClient.user.tag}`);
  startMonitor(client);
});

client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  const command = commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message);
  } catch (err) {
    console.error(`Error executing !${commandName}:`, err);
    await message.reply("Something went wrong. Please try again.").catch(() => null);
  }
});

client.login(config.token).catch((err) => {
  console.error("Failed to login:", err);
  process.exit(1);
});
