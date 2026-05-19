import "dotenv/config";
import http from "http";
import { Client, GatewayIntentBits, Collection, Events, Message } from "discord.js";
import { config } from "./config.js";
import { startMonitor } from "./monitor.js";
import { assignStarterTag } from "./nametags.js";

import * as statusCmd from "./commands/status.js";
import * as ipCmd from "./commands/ip.js";
import * as playersCmd from "./commands/players.js";
import * as pingCmd from "./commands/ping.js";
import * as helpCmd from "./commands/help.js";
import * as setfeedCmd from "./commands/setfeed.js";
import * as coinflipCmd from "./commands/coinflip.js";
import * as rollCmd from "./commands/roll.js";
import * as rateCmd from "./commands/rate.js";
import * as roastCmd from "./commands/roast.js";
import * as pollCmd from "./commands/poll.js";
import * as battleCmd from "./commands/battle.js";
import * as balanceCmd from "./commands/balance.js";
import * as shopCmd from "./commands/shop.js";
import * as buyCmd from "./commands/buy.js";
import * as inventoryCmd from "./commands/inventory.js";
import * as usetagCmd from "./commands/usetag.js";
import * as setshopCmd from "./commands/setshop.js";

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
const commandList: Command[] = [
  statusCmd, ipCmd, playersCmd, pingCmd, helpCmd,
  setfeedCmd, setshopCmd,
  coinflipCmd, rollCmd, rateCmd, roastCmd, pollCmd,
  battleCmd, balanceCmd, shopCmd, buyCmd, inventoryCmd, usetagCmd,
];

for (const cmd of commandList) {
  commands.set(cmd.name, cmd);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ Logged in as ${readyClient.user.tag}`);
  startMonitor(client);
});

// Auto-assign starter nametag when a new member joins
client.on(Events.GuildMemberAdd, async (member) => {
  await assignStarterTag(member);
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
