import { Message, EmbedBuilder } from "discord.js";
import { config } from "../config.js";
import { getStatusChannelId } from "../store.js";

export const name = "help";
export const description = "List all available bot commands";

export async function execute(message: Message) {
  const channelId = getStatusChannelId(config.statusChannelId);
  const channelLine = channelId
    ? `📡 Live feed is posting in <#${channelId}>`
    : "📡 No feed channel set — use `!setfeed` to configure one";

  const embed = new EmbedBuilder()
    .setTitle("🤖  Bot Commands")
    .setDescription(`Monitoring \`oneman.falixsrv.me\`\n${channelLine}`)
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
        name: "🎮  Fun",
        value: [
          "`!coinflip` — Flip a coin",
          "`!roll [sides]` — Roll a dice (default: d6)",
          '`!8ball <question>` — Ask the magic 8-ball',
          '`!poll "Question" "Option 1" "Option 2" ...` — Create a vote poll (up to 5 options)',
        ].join("\n"),
      },
      {
        name: "⚙️  Admin",
        value: [
          "`!setfeed [#channel]` — Set the live status feed channel",
          "*(Requires Administrator)*",
        ].join("\n"),
      },
      {
        name: "ℹ️  Other",
        value: "`!help` — Show this message",
      }
    )
    .setFooter({ text: "Status embed auto-updates every 30s • Player join/leave alerts are automatic" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
