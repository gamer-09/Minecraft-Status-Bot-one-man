import { Message, EmbedBuilder } from "discord.js";
import { config } from "../config.js";
import { getStatusChannelId, getShopChannelId } from "../store.js";

export const name = "help";
export const description = "List all available bot commands";

export async function execute(message: Message) {
  const statusChannelId = getStatusChannelId(config.statusChannelId);
  const shopChannelId = getShopChannelId();

  const statusLine = statusChannelId
    ? `📡 Live feed → <#${statusChannelId}>`
    : "📡 No feed channel set — use `!setfeed`";

  const shopLine = shopChannelId
    ? `🏪 Shop → <#${shopChannelId}>`
    : "🏪 No shop channel set — use `!setshop`";

  const embed = new EmbedBuilder()
    .setTitle("🤖  Bot Commands")
    .setDescription(`Monitoring \`oneman.falixsrv.me\`\n${statusLine}\n${shopLine}`)
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
          "`!balance [@user]` — Check your coin balance & active effects",
          "`!shop` — Browse the item shop (set channel only)",
          "`!buy <item>` — Buy an item with your coins",
          "`!inventory` — View your owned items & effects",
          "`!usetag <tag>` — Switch to an owned nametag",
        ].join("\n"),
      },
      {
        name: "🎮  Fun",
        value: [
          "`!coinflip` — Flip a coin",
          "`!roll [sides]` — Roll a dice (default: d6)",
          "`!rate <anything>` — Rate anything out of 10",
          "`!roast @user` — Deliver a spicy roast",
          '`!poll "Question" "Option 1" "Option 2" ...` — Create a poll (up to 5 options)',
        ].join("\n"),
      },
      {
        name: "⚙️  Admin",
        value: [
          "`!setfeed [#channel]` — Set the live status feed channel",
          "`!setshop [#channel]` — Set the shop channel",
          "*(Both require Administrator)*",
        ].join("\n"),
      },
      {
        name: "ℹ️  Other",
        value: "`!help` — Show this message",
      }
    )
    .setFooter({ text: "Status auto-updates every 30s • Win battles to earn coins • Spend coins in the shop" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
