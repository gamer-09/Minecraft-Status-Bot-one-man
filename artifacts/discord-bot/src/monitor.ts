import { Client, TextChannel } from "discord.js";
import { getServerStatus, ServerStatus } from "./minecraft.js";
import { buildStatusEmbed, buildPlayerJoinEmbed, buildPlayerLeaveEmbed } from "./embeds.js";
import { config } from "./config.js";

let previousPlayers: Set<string> = new Set();
let previousOnline: boolean | null = null;
let statusMessageId: string | null = null;

export function startMonitor(client: Client) {
  console.log("Starting server monitor...");
  tick(client);
  setInterval(() => tick(client), 30_000);
}

async function tick(client: Client) {
  if (!config.statusChannelId) return;

  const channel = client.channels.cache.get(config.statusChannelId) as TextChannel | undefined;
  if (!channel) return;

  const serverStatus = await getServerStatus();
  const currentPlayers = new Set(serverStatus.players);

  // Detect player joins
  for (const player of currentPlayers) {
    if (!previousPlayers.has(player)) {
      const embed = buildPlayerJoinEmbed(player, serverStatus);
      await channel.send({ embeds: [embed] }).catch(() => null);
    }
  }

  // Detect player leaves
  for (const player of previousPlayers) {
    if (!currentPlayers.has(player)) {
      const fakeStatus: ServerStatus = {
        ...serverStatus,
        players: [...currentPlayers],
        playerCount: currentPlayers.size,
      };
      const embed = buildPlayerLeaveEmbed(player, fakeStatus);
      await channel.send({ embeds: [embed] }).catch(() => null);
    }
  }

  // Announce server going online/offline
  if (previousOnline !== null && previousOnline !== serverStatus.online) {
    const msg = serverStatus.online
      ? "🟢 **The server is back online!**"
      : "🔴 **The server has gone offline.**";
    await channel.send(msg).catch(() => null);
  }

  // Update or post the pinned status message
  const statusEmbed = buildStatusEmbed(serverStatus);

  if (statusMessageId) {
    try {
      const msg = await channel.messages.fetch(statusMessageId);
      await msg.edit({ embeds: [statusEmbed] });
    } catch {
      // Message was deleted — post a fresh one
      const sent = await channel.send({ embeds: [statusEmbed] }).catch(() => null);
      statusMessageId = sent?.id ?? null;
    }
  } else {
    const sent = await channel.send({ embeds: [statusEmbed] }).catch(() => null);
    statusMessageId = sent?.id ?? null;
  }

  previousPlayers = currentPlayers;
  previousOnline = serverStatus.online;
}
