import { Message, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { scanGuildAuthority } from "../authority.js";
import { scanAndAssignStarterTags } from "../nametags.js";

export const name = "reload";
export const description = "Re-scan all members and re-apply nametags (Admin only)";

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

  const guild = message.guild;
  if (!guild) {
    await message.reply("This command can only be used inside a server.");
    return;
  }

  const pending = await message.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("🔄  Reloading...")
        .setDescription("Scanning all members and re-applying nametags. This may take a moment.")
        .setColor(0xf39c12),
    ],
  });

  try {
    await scanGuildAuthority(guild);
    await scanAndAssignStarterTags(guild);

    await pending.edit({
      embeds: [
        new EmbedBuilder()
          .setTitle("✅  Reload Complete")
          .setDescription(
            "All members have been scanned.\n\n" +
            "• Authority tags re-applied to admins & owner\n" +
            "• Starter tags applied to any untagged members\n" +
            "• Members who already had a tag were left alone"
          )
          .setColor(0x2ecc71)
          .setTimestamp(),
      ],
    });
  } catch (err) {
    console.error("[reload] Scan failed:", err);
    await pending.edit({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌  Reload Failed")
          .setDescription("Something went wrong during the scan. Check the bot logs for details.")
          .setColor(0xe74c3c),
      ],
    });
  }
}
