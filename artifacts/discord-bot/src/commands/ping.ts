import { Message, EmbedBuilder } from "discord.js";
import { getServerStatus } from "../minecraft.js";

export const name = "ping";
export const description = "Ping the Minecraft server and check response time";

export async function execute(message: Message) {
  const msg = await message.reply("Pinging server...");
  const serverStatus = await getServerStatus();

  const embed = new EmbedBuilder()
    .setTitle("🏓 Server Ping")
    .setColor(serverStatus.online ? 0x57f287 : 0xed4245)
    .addFields(
      { name: "Status", value: serverStatus.online ? "🟢 Online" : "🔴 Offline", inline: true },
      { name: "Latency", value: serverStatus.online ? `${serverStatus.ping}ms` : "N/A", inline: true }
    )
    .setTimestamp();

  await msg.edit({ content: "", embeds: [embed] });
}
