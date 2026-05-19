import { Message, EmbedBuilder } from "discord.js";
import { getServerStatus } from "../minecraft.js";
import { config } from "../config.js";

export const name = "players";
export const description = "See who is currently online on the Minecraft server";

export async function execute(message: Message) {
  const msg = await message.reply("⏳ Fetching player list...");
  const status = await getServerStatus();

  if (!status.online) {
    await msg.edit({
      content: "",
      embeds: [
        new EmbedBuilder()
          .setTitle("🔴  Server Offline")
          .setDescription("The server is offline — no player data available.")
          .setColor(0xe74c3c)
          .setTimestamp(),
      ],
    });
    return;
  }

  const playerList =
    status.players.length > 0
      ? status.players.map((p) => `> 🎮 **${p}**`).join("\n")
      : "*The server is empty right now. Be the first to join!*";

  const embed = new EmbedBuilder()
    .setTitle(`👥  Online Players`)
    .setDescription(playerList)
    .setColor(0x3498db)
    .addFields(
      { name: "Count", value: `${status.playerCount}/${status.maxPlayers}`, inline: true },
      { name: "Server", value: `\`${config.mc.host}\``, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: "Live data" });

  await msg.edit({ content: "", embeds: [embed] });
}
