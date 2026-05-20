import { Message, EmbedBuilder } from "discord.js";
import { config } from "../config.js";
import { getStatusChannelId, getShopChannelId, getVipChannelId, getBattleChannelId, getLeaderboardChannelId } from "../store.js";

export const name = "help";
export const description = "List all available bot commands";

export async function execute(message: Message) {
  const statusChannelId = getStatusChannelId(config.statusChannelId);
  const shopChannelId = getShopChannelId();
  const vipChannelId = getVipChannelId();
  const battleChannelId = getBattleChannelId();
  const leaderboardChannelId = getLeaderboardChannelId();

  const lines = [
    statusChannelId ? `📡 Live feed → <#${statusChannelId}>` : "📡 No feed channel — use `!setfeed`",
    shopChannelId ? `🏪 Shop → <#${shopChannelId}>` : "🏪 Shop disabled — use `!setshop`",
    vipChannelId ? `🔑 VIP channel → <#${vipChannelId}>` : "🔑 No VIP channel — use `!setvip`",
    battleChannelId ? `⚔️ Battle arena → <#${battleChannelId}>` : "⚔️ No battle arena — use `!setbattle`",
    leaderboardChannelId ? `🏆 Leaderboard updates → <#${leaderboardChannelId}>` : "🏆 No leaderboard channel — use `!setleaderboard`",
  ];

  const embed = new EmbedBuilder()
    .setTitle("🤖  Bot Commands")
    .setDescription(`Monitoring \`oneman.falixsrv.me\`\n${lines.join("\n")}`)
    .setColor(0x5865f2)
    .addFields(
      {
        name: "⛏️  Minecraft",
        value: [
          "`!start` — Get the link & IP to wake up the server on Falix",
          "`!status` — Live server status, players & ping",
          "`!players` — Who's online right now",
          "`!ping` — Server response time & quality",
          "`!ip` — Server address & how to connect",
        ].join("\n"),
      },
      {
        name: "⚔️  Battle Arena (battle channel only)",
        value: [
          "`!battle @user` — Challenge someone to a turn-based duel",
          "`!accept` — Accept a pending battle challenge",
          "`!decline` — Decline a battle challenge",
          "",
          "**How it works:** Both fighters receive private DMs each turn.",
          "Choose from 4 moves: Attack, Heavy, Defend, Special.",
          "Winner earns coins — result announced in the arena.",
        ].join("\n"),
      },
      {
        name: "💰  Economy",
        value: [
          "`!leaderboard` — Top 10 players ranked by coins",
          "`!battlestats [@user]` — Win/loss record, streaks, coins earned",
          "`!profile [@user]` — Full profile: balance, tag, effects, battle record",
          "`!daily` — Claim your daily coin reward (24h cooldown)",
          "`!balance [@user]` — Check coins, tag & active effects",
          "`!shop` — Browse the item shop",
          "`!buy <item>` — Buy an item with your coins",
          "`!inventory` — View owned items & effects",
          "`!usetag <tag>` — Switch to an owned nametag",
        ].join("\n"),
      },
      {
        name: "⚡  Power Tags (from shop)",
        value: [
          "`scorched by dragonfire` — Fiery red name (400 coins)",
          "`blessed by thunder gods` — Ancient gold name (600 coins)",
          "`risen from the deep` — Ocean blue name (600 coins)",
          "`consumed by the void` — Void purple name (800 coins)",
          "`bearer of emerald crown` — Emerald green name (800 coins)",
          "`keeper of forbidden gate` — VIP channel + orange name (1500 coins)",
          "`ascended above all` — Top of member list + gold name (2500 coins)",
        ].join("\n"),
      },
      {
        name: "🎮  Fun",
        value: [
          "`!coinflip` — Flip a coin",
          "`!roll [sides]` — Roll a dice (default: d6)",
          "`!rate <anything>` — Rate anything out of 10",
          "`!roast @user` — Deliver a spicy roast",
          '`!poll "Question" "Opt1" "Opt2" ...` — Create a poll',
        ].join("\n"),
      },
      {
        name: "⚙️  Admin",
        value: [
          "`!setfeed [#channel]` — Set the live status feed channel",
          "`!setshop [#channel]` — Set the shop channel",
          "`!setvip [#channel]` — Set the secret VIP channel",
          "`!setbattle [#channel]` — Designate the exclusive battle arena",
          "`!setleaderboard [#channel]` — Set a channel for live leaderboard updates",
          "`!give @user <amount>` — Give or take coins from a player",
          "`!give @user -200` — Use a negative number to remove coins",
          "`!stop feed|shop|vip|battle|leaderboard` — Disable a feature",
          "`!reload` — Re-scan all members and re-apply nametags",
          "`!testnick @user` — Test nickname permission on a specific member",
          "*(All require Administrator)*",
        ].join("\n"),
      },
      {
        name: "👑  Authority Tags — Auto-assigned, cannot be bought",
        value: [
          "🔴 **Server Owner** → `Name [forged this realm]` — deep crimson role",
          "🔵 **Admins** → `Name [wields the hammer]` — steel blue role",
          "*Applied automatically on startup or when roles change.*",
        ].join("\n"),
      },
      {
        name: "🏷️  Nametag Format",
        value: "All nicknames are set as `Username [tag]`.\n⚠️ Discord does not allow bots to change the **server owner's** nickname — set it manually.",
      },
      { name: "ℹ️  Other", value: "`!help` — Show this message" }
    )
    .setFooter({ text: "Win battles → earn coins → spend in shop → get real Discord perks" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
