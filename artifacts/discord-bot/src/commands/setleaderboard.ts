import { Message, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { setLeaderboardChannelId } from "../store.js";

export const name = "setleaderboard";
export const description = "Set the channel for live leaderboard updates — !setleaderboard [#channel] (Admin only)";

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

  const mentioned = message.mentions.channels.first();
  const target = mentioned ?? message.channel;

  if (!target || !("send" in target)) {
    await message.reply("Could not resolve a valid text channel.");
    return;
  }

  setLeaderboardChannelId(target.id);

  await message.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("✅  Leaderboard Channel Set")
        .setDescription(
          `<#${target.id}> will now receive automatic leaderboard updates whenever the top 10 changes.\n\n` +
          "Updates are posted after:\n" +
          "• ⚔️ A battle ends\n" +
          "• 🎁 A daily reward is claimed\n" +
          "• 💰 An admin uses `!give`"
        )
        .setColor(0x2ecc71)
        .setTimestamp(),
    ],
  });
}
