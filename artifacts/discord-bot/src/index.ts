import "dotenv/config";
import http from "http";
import { Client, GatewayIntentBits, Collection, Events, Message } from "discord.js";
import { config } from "./config.js";
import { startMonitor } from "./monitor.js";
import { assignStarterTag, scanAndAssignStarterTags } from "./nametags.js";
import { applyAuthorityTag, scanGuildAuthority } from "./authority.js";

import * as statusCmd from "./commands/status.js";
import * as ipCmd from "./commands/ip.js";
import * as playersCmd from "./commands/players.js";
import * as pingCmd from "./commands/ping.js";
import * as helpCmd from "./commands/help.js";
import * as setfeedCmd from "./commands/setfeed.js";
import * as setshopCmd from "./commands/setshop.js";
import * as setvipCmd from "./commands/setvip.js";
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
import * as reloadCmd from "./commands/reload.js";

const PREFIX = "!";

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
  setfeedCmd, setshopCmd, setvipCmd,
  coinflipCmd, rollCmd, rateCmd, roastCmd, pollCmd,
  battleCmd, balanceCmd, shopCmd, buyCmd, inventoryCmd, usetagCmd, reloadCmd,
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

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`✅ Logged in as ${readyClient.user.tag}`);
  startMonitor(client);

  // Scan all guilds: authority tags first, then starter tags for everyone else
  for (const [, guild] of readyClient.guilds.cache) {
    await scanGuildAuthority(guild);
    await scanAndAssignStarterTags(guild);
  }
});

// New member joins — assign starter tag, then check if they're an admin/owner
client.on(Events.GuildMemberAdd, async (member) => {
  await applyAuthorityTag(member);
  // Only assign a starter tag if authority didn't already set one
  const { getUser } = await import("./store.js");
  const user = getUser(member.id);
  if (!user.nametag) {
    await assignStarterTag(member);
  }
});

// Member's roles change — re-evaluate authority status
client.on(Events.GuildMemberUpdate, async (_oldMember, newMember) => {
  await applyAuthorityTag(newMember);
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
