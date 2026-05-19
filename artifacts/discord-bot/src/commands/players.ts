import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Colors } from "discord.js";
import { getServerStatus } from "../minecraft.js";
import { config } from "../config.js";

export const data = new SlashCommandBuilder()
  .setName("players")
  .setDescription("See who is currently online on the Minecraft server");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const serverStatus = await getServerStatus();

  if (!serverStatus.online) {
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Server Offline")
          .setDescription("The server is currently offline. No player data available.")
          .setColor(Colors.Red)
          .setTimestamp(),
      ],
    });
    return;
  }

  const playerList =
    serverStatus.players.length > 0
      ? serverStatus.players.map((p) => `• **${p}**`).join("\n")
      : "*No players online right now.*";

  const embed = new EmbedBuilder()
    .setTitle(`👥 Online Players — ${serverStatus.playerCount}/${serverStatus.maxPlayers}`)
    .setDescription(playerList)
    .setColor(Colors.Blurple)
    .addFields({ name: "Server", value: `\`${config.mc.host}\``, inline: true })
    .setTimestamp()
    .setFooter({ text: "Live data" });

  await interaction.editReply({ embeds: [embed] });
}
