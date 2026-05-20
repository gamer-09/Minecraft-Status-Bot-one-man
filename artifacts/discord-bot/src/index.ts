import "dotenv/config";
import http from "http";
import { Client, GatewayIntentBits, Partials, Collection, Events, Message } from "discord.js";
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
import * as setbattleCmd from "./commands/setbattle.js";
import * as coinflipCmd from "./commands/coinflip.js";
import * as rollCmd from "./commands/roll.js";
import * as rateCmd from "./commands/rate.js";
import * as roastCmd from "./commands/roast.js";
import * as pollCmd from "./commands/poll.js";
import * as battleCmd from "./commands/battle.js";
import * as acceptCmd from "./commands/accept.js";
import * as declineCmd from "./commands/decline.js";
  import * as leaderboardCmd from "./commands/leaderboard.js";
  import * as battlestatsCmd from "./commands/battlestats.js";
  import * as dailyCmd from "./commands/daily.js";
  import * as giveCmd from "./commands/give.js";
  import * as profileCmd from "./commands/profile.js";
import * as balanceCmd from "./commands/balance.js";
import * as shopCmd from "./commands/shop.js";
import * as buyCmd from "./commands/buy.js";
import * as inventoryCmd from "./commands/inventory.js";
import * as usetagCmd from "./commands/usetag.js";
import * as reloadCmd from "./commands/reload.js";
import * as testnickCmd from "./commands/testnick.js";
import * as stopCmd from "./commands/stop.js";
import * as startCmd from "./commands/start.js";

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
  setfeedCmd, setshopCmd, setvipCmd, setbattleCmd,
  coinflipCmd, rollCmd, rateCmd, roastCmd, pollCmd,
  battleCmd, acceptCmd, declineCmd, leaderboardCmd, battlestatsCmd, dailyCmd, giveCmd, profileCmd,
  balanceCmd, shopCmd, buyCmd, inventoryCmd, usetagCmd, reloadCmd, testnickCmd, stopCmd, startCmd,
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
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel, Partials.Message],
});

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`✅ Logged in as ${readyClient.user.tag}`);
  startMonitor(client);

  for (const [, guild] of readyClient.guilds.cache) {
    try {
      const members = await guild.members.fetch();
      await scanGuildAuthority(guild, members);
      await scanAndAssignStarterTags(guild, members);
    } catch (err) {
      console.error(`[startup] Failed to scan guild "${guild.name}":`, err);
    }
  }
});

client.on("error", (err) => {
  console.error("[discord] Client error:", err);
});

client.on(Events.GuildMemberAdd, async (member) => {
  await applyAuthorityTag(member);
  const { getUser } = await import("./store.js");
  const user = getUser(member.id);
  if (!user.nametag) {
    await assignStarterTag(member);
  }
});

client.on(Events.GuildMemberUpdate, async (_oldMember, newMember) => {
  await applyAuthorityTag(newMember);
});

client.on(Events.MessageCreate, async (message: Message) => {
  if (message.author.bot) return;
  // Only handle guild messages — DM responses are collected inside the battle engine
  if (message.channel.isDMBased()) return;
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
