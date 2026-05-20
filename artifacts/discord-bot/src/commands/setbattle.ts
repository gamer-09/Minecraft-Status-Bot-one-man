import { Message, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { setBattleChannelId } from "../store.js";

export const name = "setbattle";
export const description = "Designate the exclusive battle arena channel — !setbattle [#channel] (Admin only)";

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

  setBattleChannelId(target.id);

  await message.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("✅  Battle Arena Set")
        .setDescription(`<#${target.id}> is now the designated **battle arena**.\n\nAll battle commands (\`!battle\`, \`!accept\`, \`!decline\`) will only work in this channel.`)
        .setColor(0x2ecc71)
        .addFields({
          name: "⚔️ How battles work",
          value: [
            "1. A player uses `!battle @user` to issue a challenge",
            "2. The opponent types `!accept` or `!decline` (90 second window)",
            "3. If accepted — both players receive their battle turns **via DM** (private)",
            "4. Each round: choose Attack, Heavy, Defend, or Special",
            "5. Battle result announced here when it ends",
          ].join("\n"),
        })
        .setTimestamp(),
    ],
  });
}
