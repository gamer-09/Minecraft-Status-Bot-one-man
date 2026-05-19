import { EmbedBuilder, Colors } from "discord.js";
import type { ServerStatus } from "./minecraft.js";
import { config } from "./config.js";

export function buildStatusEmbed(status: ServerStatus): EmbedBuilder {
  if (!status.online) {
    return new EmbedBuilder()
      .setTitle("🔴 Server Offline")
      .setDescription("The Minecraft server is currently **offline**.")
      .setColor(Colors.Red)
      .addFields({ name: "IP", value: `\`${config.mc.host}\``, inline: true })
      .setTimestamp()
      .setFooter({ text: "Last checked" });
  }

  const playerList =
    status.players.length > 0
      ? status.players.map((p) => `• ${p}`).join("\n")
      : "*No players online*";

  return new EmbedBuilder()
    .setTitle("🟢 Server Online")
    .setDescription(status.motd || "Welcome to the server!")
    .setColor(Colors.Green)
    .addFields(
      { name: "IP", value: `\`${config.mc.host}\``, inline: true },
      { name: "Version", value: status.version, inline: true },
      { name: "Ping", value: `${status.ping}ms`, inline: true },
      {
        name: `Players (${status.playerCount}/${status.maxPlayers})`,
        value: playerList,
      }
    )
    .setTimestamp()
    .setFooter({ text: "Last updated" });
}

export function buildJoinEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("🎮 How to Join")
    .setDescription("Use one of the addresses below in Minecraft **Java Edition**.")
    .setColor(0x57f287)
    .addFields(
      { name: "Primary IP", value: `\`${config.mc.host}\``, inline: true },
      {
        name: "Direct IP",
        value: `\`${config.mc.queryHost}:${config.mc.queryPort}\``,
        inline: true,
      },
      {
        name: "Steps",
        value:
          "1. Open Minecraft Java Edition\n2. Click **Multiplayer**\n3. Click **Add Server**\n4. Paste the IP and click **Done**\n5. Connect!",
      }
    )
    .setTimestamp();
}

export function buildPlayerJoinEmbed(playerName: string, status: ServerStatus): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("✅ Player Joined")
    .setDescription(`**${playerName}** joined the server!`)
    .setColor(0x57f287)
    .addFields({
      name: `Online Players (${status.playerCount}/${status.maxPlayers})`,
      value: status.players.length > 0 ? status.players.map((p) => `• ${p}`).join("\n") : "*No players*",
    })
    .setTimestamp();
}

export function buildPlayerLeaveEmbed(playerName: string, status: ServerStatus): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("👋 Player Left")
    .setDescription(`**${playerName}** left the server.`)
    .setColor(Colors.Orange)
    .addFields({
      name: `Online Players (${status.playerCount}/${status.maxPlayers})`,
      value: status.players.length > 0 ? status.players.map((p) => `• ${p}`).join("\n") : "*No players*",
    })
    .setTimestamp();
}
