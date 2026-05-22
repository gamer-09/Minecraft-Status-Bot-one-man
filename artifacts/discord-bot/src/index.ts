import "dotenv/config";
import http from "http";
import { Client, GatewayIntentBits, Partials, Collection, Events, Message, REST, Routes, SlashCommandBuilder, ChatInputCommandInteraction, User as DiscordUser } from "discord.js";
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
import * as setleaderboardCmd from "./commands/setleaderboard.js";
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
  battleCmd, acceptCmd, declineCmd, leaderboardCmd, battlestatsCmd, dailyCmd, giveCmd, profileCmd, setleaderboardCmd,
  balanceCmd, shopCmd, buyCmd, inventoryCmd, usetagCmd, reloadCmd, testnickCmd, stopCmd, startCmd,
];

for (const cmd of commandList) {
  commands.set(cmd.name, cmd);
}

// ─── Slash Command Definitions ─────────────────────────────────────────────────
// Commands that need options beyond name/description
const SLASH_OPTIONS: Record<string, (b: SlashCommandBuilder) => void> = {
  give:    (b) => { b.addUserOption(o => o.setName("user").setDescription("User to give or take coins from").setRequired(true)); b.addIntegerOption(o => o.setName("amount").setDescription("Amount (negative to remove)").setRequired(true)); },
  battle:  (b) => { b.addUserOption(o => o.setName("opponent").setDescription("User to challenge").setRequired(true)); },
  buy:     (b) => { b.addStringOption(o => o.setName("item").setDescription("Item name to buy").setRequired(true)); },
  usetag:  (b) => { b.addStringOption(o => o.setName("tag").setDescription("Tag name to switch to").setRequired(true)); },
  rate:    (b) => { b.addStringOption(o => o.setName("subject").setDescription("What to rate").setRequired(true)); },
  roast:   (b) => { b.addUserOption(o => o.setName("target").setDescription("User to roast").setRequired(true)); },
  profile: (b) => { b.addUserOption(o => o.setName("user").setDescription("User to view (leave blank for yourself)").setRequired(false)); },
  poll:    (b) => {
    b.addStringOption(o => o.setName("question").setDescription("Poll question").setRequired(true));
    b.addStringOption(o => o.setName("option1").setDescription("Option 1").setRequired(true));
    b.addStringOption(o => o.setName("option2").setDescription("Option 2").setRequired(true));
    b.addStringOption(o => o.setName("option3").setDescription("Option 3").setRequired(false));
    b.addStringOption(o => o.setName("option4").setDescription("Option 4").setRequired(false));
    b.addStringOption(o => o.setName("option5").setDescription("Option 5").setRequired(false));
  },
};

const slashCommandData = commandList.map(cmd => {
  const builder = new SlashCommandBuilder().setName(cmd.name).setDescription(cmd.description);
  SLASH_OPTIONS[cmd.name]?.(builder);
  return builder.toJSON();
});

// ─── Slash ↔ Message Adapter ───────────────────────────────────────────────────
function buildFakeMessage(interaction: ChatInputCommandInteraction): Message {
  const cmd = interaction.commandName;
  let content = `!${cmd}`;
  let mentionedUser: DiscordUser | null = null;

  switch (cmd) {
    case "buy":
      content = `!buy ${interaction.options.getString("item") ?? ""}`;
      break;
    case "usetag":
      content = `!usetag ${interaction.options.getString("tag") ?? ""}`;
      break;
    case "rate":
      content = `!rate ${interaction.options.getString("subject") ?? ""}`;
      break;
    case "give": {
      const u = interaction.options.getUser("user");
      const amt = interaction.options.getInteger("amount") ?? 0;
      mentionedUser = u;
      content = `!give <@${u?.id}> ${amt}`;
      break;
    }
    case "battle": {
      const opp = interaction.options.getUser("opponent");
      mentionedUser = opp;
      content = `!battle <@${opp?.id}>`;
      break;
    }
    case "roast": {
      const tgt = interaction.options.getUser("target");
      mentionedUser = tgt;
      content = `!roast <@${tgt?.id}>`;
      break;
    }
    case "profile": {
      mentionedUser = interaction.options.getUser("user");
      break;
    }
    case "poll": {
      const q = interaction.options.getString("question") ?? "";
      const opts = ([1, 2, 3, 4, 5] as const)
        .map(i => interaction.options.getString(`option${i}`))
        .filter(Boolean);
      content = `!poll "${q}" ${opts.map(o => `"${o}"`).join(" ")}`;
      break;
    }
  }

  let replied = false;
  const reply = async (payload: unknown) => {
    if (!replied) {
      replied = true;
      if (interaction.deferred) return interaction.editReply(payload as never);
      await interaction.reply(payload as never);
      return interaction.fetchReply();
    }
    return interaction.followUp(payload as never);
  };

  return {
    reply,
    channel: interaction.channel,
    author: interaction.user,
    member: interaction.member,
    guild: interaction.guild,
    client: interaction.client,
    content,
    mentions: { users: { first: () => mentionedUser } },
    delete: async () => {},
  } as unknown as Message;
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

  // ── Register slash commands (guild = instant, global = ~1hr) ───────────────
  const rest = new REST().setToken(config.token);
  const route = config.guildId
    ? Routes.applicationGuildCommands(config.clientId, config.guildId)
    : Routes.applicationCommands(config.clientId);
  try {
    await rest.put(route, { body: slashCommandData });
    console.log(`✅ Registered ${slashCommandData.length} slash commands (${config.guildId ? "guild — instant" : "global — ~1hr"})`);
  } catch (err) {
    console.error("[slash] Failed to register commands:", err);
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

// ─── Slash Command Handler ─────────────────────────────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  const fakeMessage = buildFakeMessage(interaction);

  try {
    await command.execute(fakeMessage);
  } catch (err) {
    console.error(`[slash] Error in /${interaction.commandName}:`, err);
    const payload = { content: "Something went wrong. Please try again.", flags: 64 };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload).catch(() => null);
    } else {
      await interaction.reply(payload).catch(() => null);
    }
  }
});

client.login(config.token).catch((err) => {
  console.error("Failed to login:", err);
  process.exit(1);
});
