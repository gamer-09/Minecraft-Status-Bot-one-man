import { Message, EmbedBuilder } from "discord.js";
import { config } from "../config.js";
import { getStatusChannelId, getShopChannelId, getVipChannelId } from "../store.js";

export const name = "help";
export const description = "List all available bot commands";

export async function execute(message: Message) {
  const statusChannelId = getStatusChannelId(config.statusChannelId);
  const shopChannelId = getShopChannelId();
  const vipChannelId = getVipChannelId();

  const lines = [
    statusChannelId ? `📡 Live feed → <#${statusChannelId}>` : "📡 No feed channel — use `!setfeed`",
    shopChannelId ? `🏪 Shop → <#${shopChannelId}>` : "🏪 No shop channel — use `!setshop`",
    vipChannelId ? `🔑 VIP channel → <#${vipChannelId}>` : "🔑 No VIP channel — use `!setvip`",
  ];

  const embed = new EmbedBuilder()
    .setTitle("🤖  Bot Commands")
    .setDescription(`Monitoring \`oneman.falixsrv.me\`\n${lines.join("\n")}`)
    .setColor(0x5865f2)
    .addFields(
      {
        name: "⛏️  Minecraft",
        value: [
          "`!status` — Live server status, players & ping",
          "`!players` — Who's online right now",
          "`!ping` — Server response time & quality",
          "`!ip` — Server address & how to connect",
        ].join("\n"),
      },
      {
        name: "⚔️  Economy & Battles",
        value: [
          "`!battle @user` — Challenge someone, winner earns coins",
          "`!balance [@user]` — Check coins, tag & active effects",
          "`!shop` — Browse the item shop (set channel only)",
          "`!buy <item>` — Buy an item with your coins",
          "`!inventory` — View owned items & effects",
          "`!usetag <tag>` — Switch to an owned nametag",
        ].join("\n"),
      },
      {
        name: "⚡  Power Tags (from shop)",
        value: [
          "`burns bright` — Fiery red username (400 coins)",
          "`struck by lightning` — Golden username (600 coins)",
          "`born of the ocean` — Ocean blue username (600 coins)",
          "`touched by the void` — Deep purple username (800 coins)",
          "`the emerald one` — Emerald green username (800 coins)",
          "`holds the key` — VIP channel access + orange name (1500 coins)",
          "`above the rest` — Top of member list + gold name (2500 coins)",
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
          "*(All require Administrator)*",
        ].join("\n"),
      },
      {
        name: "👑  Authority Tags — Auto-assigned, cannot be bought",
        value: [
          "🔴 **Server Owner** → `[forged this realm]` — deep crimson role, hoisted at top",
          "🔵 **Admins** → `[wields the hammer]` — steel blue role, hoisted at top",
          "*Applied automatically when the bot starts or roles change.*",
        ].join("\n"),
      },
      { name: "ℹ️  Other", value: "`!help` — Show this message" }
    )
    .setFooter({ text: "Win battles → earn coins → spend in shop → get real Discord perks" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
