import { Message, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { setStatusChannelId } from "../store.js";

export const name = "setfeed";
export const description = "Set the channel for live server status updates (Admin only)";

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

  setStatusChannelId(target.id);

  const embed = new EmbedBuilder()
    .setTitle("✅  Feed Channel Updated")
    .setDescription(`Live server updates will now be posted in <#${target.id}>.`)
    .setColor(0x2ecc71)
    .addFields({
      name: "📋 What's posted",
      value: "• Auto-updating status embed (every 30s)\n• Player join & leave alerts\n• Server online/offline announcements",
    })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
