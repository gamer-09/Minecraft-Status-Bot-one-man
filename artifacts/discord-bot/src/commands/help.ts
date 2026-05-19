import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { config } from "../config.js";
import { getStatusChannelId } from "../store.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("List all available bot commands");

export async function execute(interaction: ChatInputCommandInteraction) {
  const channelId = getStatusChannelId(config.statusChannelId);
  const channelLine = channelId
    ? `Live updates are posting in <#${channelId}>`
    : "No status channel set — use `/setchannel` to configure one";

  const embed = new EmbedBuilder()
    .setTitle("🤖 Minecraft Bot — Command List")
    .setDescription(`Monitoring \`oneman.falixsrv.me\`\n${channelLine}`)
    .setColor(0x5865f2)
    .addFields(
      {
        name: "📊 Server Info",
        value: [
          "`/status` — Live server status: online/offline, players, version, ping",
          "`/players` — See who is currently online",
          "`/ping` — Check the server's response time",
          "`/ip` — Get the server address and how to connect",
        ].join("\n"),
      },
      {
        name: "⚙️ Admin",
        value: [
          "`/setchannel [channel]` — Set the channel for live status updates and event alerts",
          "*(Requires Administrator permission)*",
        ].join("\n"),
      },
      {
        name: "ℹ️ Other",
        value: "`/help` — Show this message",
      }
    )
    .setFooter({ text: "Status embed updates every 30 seconds • Player join/leave and online/offline alerts are automatic" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
