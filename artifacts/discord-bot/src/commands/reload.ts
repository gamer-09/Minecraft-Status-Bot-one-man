import { Message, EmbedBuilder, PermissionFlagsBits, PermissionsBitField } from "discord.js";
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

  // ── Pre-flight: check bot permissions ──────────────────────────────────────
  const botMember = guild.members.me;
  const canManageNicks = botMember?.permissions.has(PermissionsBitField.Flags.ManageNicknames) ?? false;
  const botHighestRole = botMember?.roles.highest;

  if (!canManageNicks) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("⚠️  Missing Permission")
          .setDescription(
            "The bot does not have the **Manage Nicknames** permission.\n\n" +
            "Go to **Server Settings → Roles → Hermes01** and enable **Manage Nicknames**, then run `!reload` again."
          )
          .setColor(0xe74c3c),
      ],
    });
    return;
  }

  const pending = await message.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("🔄  Reloading...")
        .setDescription("Scanning all members. This may take a moment.")
        .setColor(0xf39c12),
    ],
  });

  try {
    await scanGuildAuthority(guild);
    const result = await scanAndAssignStarterTags(guild);

    const lines: string[] = [];

    if (result.assigned.length > 0)
      lines.push(`✅ **Tagged (new):** ${result.assigned.join(", ")}`);
    if (result.reapplied.length > 0)
      lines.push(`🔄 **Re-applied:** ${result.reapplied.join(", ")}`);
    if (result.skipped > 0)
      lines.push(`⏭️ **Already tagged:** ${result.skipped} member(s)`);
    if (result.failed.length > 0) {
      lines.push(
        `❌ **Could not rename:** ${result.failed.join(", ")}\n` +
        `> The bot's role must be **above** these members' roles in **Server Settings → Roles**.\n` +
        `> Bot's highest role: **${botHighestRole?.name ?? "unknown"}** (position ${botHighestRole?.position ?? "?"})`
      );
    }

    if (lines.length === 0) lines.push("No changes needed — all members already have tags.");

    await pending.edit({
      embeds: [
        new EmbedBuilder()
          .setTitle("✅  Reload Complete")
          .setDescription(lines.join("\n\n"))
          .setColor(result.failed.length > 0 ? 0xe67e22 : 0x2ecc71)
          .setTimestamp(),
      ],
    });
  } catch (err) {
    console.error("[reload] Scan failed:", err);
    await pending.edit({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌  Reload Failed")
          .setDescription("Something went wrong during the scan. Check the bot logs.")
          .setColor(0xe74c3c),
      ],
    });
  }
}
