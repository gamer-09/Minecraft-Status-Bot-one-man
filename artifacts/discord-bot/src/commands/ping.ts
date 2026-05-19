import { Message, EmbedBuilder } from "discord.js";
import { getServerStatus } from "../minecraft.js";

export const name = "ping";
export const description = "Ping the Minecraft server and check response time";

export async function execute(message: Message) {
  const msg = await message.reply("🏓 Pinging server...");
  const status = await getServerStatus();

  const pingEmoji = !status.online ? "🔴" : status.ping < 80 ? "🟢" : status.ping < 150 ? "🟡" : "🔴";
  const quality = !status.online ? "Offline" : status.ping < 80 ? "Excellent" : status.ping < 150 ? "Good" : "Poor";

  const embed = new EmbedBuilder()
    .setTitle("🏓  Server Ping")
    .setColor(status.online ? (status.ping < 150 ? 0x2ecc71 : 0xe67e22) : 0xe74c3c)
    .addFields(
      { name: "Status", value: status.online ? "🟢 Online" : "🔴 Offline", inline: true },
      { name: "Latency", value: status.online ? `${status.ping}ms` : "N/A", inline: true },
      { name: "Quality", value: `${pingEmoji} ${quality}`, inline: true }
    )
    .setTimestamp();

  await msg.edit({ content: "", embeds: [embed] });
}
