import { Message, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { clearStatusChannelId, clearShopChannelId, clearVipChannelId } from "../store.js";

export const name = "stop";
export const description = "Disable a bot feature — !stop <feed|shop|vip> (Admin only)";

const USAGE = "Usage: `!stop feed` · `!stop shop` · `!stop vip`";

export async function execute(message: Message) {
  if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🚫  Access Denied")
          .setDescription("You need **Administrator** permission to use this command.")
          .setColor(0xe74c3c),
      ],
    });
    return;
  }

  const args = message.content.trim().split(/\s+/);
  const sub = args[1]?.toLowerCase();

  if (!sub || !["feed", "shop", "vip"].includes(sub)) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("❓  Unknown target")
          .setDescription(`Please specify what to stop.\n\n${USAGE}`)
          .setColor(0xe67e22),
      ],
    });
    return;
  }

  if (sub === "feed") {
    clearStatusChannelId();
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("⏹️  Feed Stopped")
          .setDescription("Live server status updates have been disabled.\nRun `!setfeed` to re-enable.")
          .setColor(0x95a5a6)
          .setTimestamp(),
      ],
    });
  } else if (sub === "shop") {
    clearShopChannelId();
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("⏹️  Shop Channel Cleared")
          .setDescription("The shop channel restriction has been removed — `!shop` now works anywhere.\nRun `!setshop` to restrict it again.")
          .setColor(0x95a5a6)
          .setTimestamp(),
      ],
    });
  } else if (sub === "vip") {
    clearVipChannelId();
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("⏹️  VIP Channel Cleared")
          .setDescription("The VIP channel has been unlinked. Members with the VIP tag will no longer gain automatic access.\nRun `!setvip` to set a new one.")
          .setColor(0x95a5a6)
          .setTimestamp(),
      ],
    });
  }
}
