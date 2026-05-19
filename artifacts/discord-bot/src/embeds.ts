import { EmbedBuilder, Colors } from "discord.js";
import type { ServerStatus } from "./minecraft.js";
import { config } from "./config.js";

const ACCENT = 0x2ecc71;
const OFFLINE_COLOR = 0xe74c3c;
const WARN_COLOR = 0xe67e22;

export function buildStatusEmbed(status: ServerStatus): EmbedBuilder {
  if (!status.online) {
    return new EmbedBuilder()
      .setTitle("🔴  Server Offline")
      .setDescription("The Minecraft server is currently **offline**.\nIt will be checked again in 30 seconds.")
      .setColor(OFFLINE_COLOR)
      .addFields(
        { name: "🌐 Address", value: `\`${config.mc.host}\``, inline: true },
        { name: "⏱️ Next Check", value: "~30 seconds", inline: true }
      )
      .setTimestamp()
      .setFooter({ text: "Last checked" });
  }

  const playerList =
    status.players.length > 0
      ? status.players.map((p) => `\`${p}\``).join("  ")
      : "*No players online*";

  const pingEmoji = status.ping < 80 ? "🟢" : status.ping < 150 ? "🟡" : "🔴";

  return new EmbedBuilder()
    .setTitle("🟢  Server Online")
    .setDescription(`**${status.motd || "Welcome to the server!"}**`)
    .setColor(ACCENT)
    .addFields(
      { name: "🌐 Address", value: `\`${config.mc.host}\``, inline: true },
      { name: "🎮 Version", value: status.version, inline: true },
      { name: `${pingEmoji} Ping`, value: `${status.ping}ms`, inline: true },
      {
        name: `👥 Players — ${status.playerCount}/${status.maxPlayers}`,
        value: playerList,
      }
    )
    .setTimestamp()
    .setFooter({ text: "Updates every 30 seconds" });
}

export function buildJoinEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle("🎮  How to Join")
    .setDescription("Connect to the server using **Minecraft Java Edition**.")
    .setColor(ACCENT)
    .addFields(
      { name: "🌐 Primary Address", value: `\`${config.mc.host}\``, inline: true },
      { name: "🔌 Direct IP", value: `\`${config.mc.queryHost}:${config.mc.queryPort}\``, inline: true },
      {
        name: "📋 Steps",
        value:
          "1. Open **Minecraft Java Edition**\n" +
          "2. Click **Multiplayer**\n" +
          "3. Click **Add Server**\n" +
          "4. Paste the address and hit **Done**\n" +
          "5. Double-click to connect — see you in-game! 👋",
      }
    )
    .setTimestamp();
}

export function buildPlayerJoinEmbed(playerName: string, status: ServerStatus): EmbedBuilder {
  const playerList = status.players.length > 0
    ? status.players.map((p) => `\`${p}\``).join("  ")
    : "*No players*";

  return new EmbedBuilder()
    .setTitle("✅  Player Joined")
    .setDescription(`**${playerName}** just joined the server!`)
    .setColor(ACCENT)
    .addFields({
      name: `👥 Online — ${status.playerCount}/${status.maxPlayers}`,
      value: playerList,
    })
    .setTimestamp();
}

export function buildPlayerLeaveEmbed(playerName: string, status: ServerStatus): EmbedBuilder {
  const playerList = status.players.length > 0
    ? status.players.map((p) => `\`${p}\``).join("  ")
    : "*Server is empty*";

  return new EmbedBuilder()
    .setTitle("👋  Player Left")
    .setDescription(`**${playerName}** has left the server.`)
    .setColor(WARN_COLOR)
    .addFields({
      name: `👥 Online — ${status.playerCount}/${status.maxPlayers}`,
      value: playerList,
    })
    .setTimestamp();
}
