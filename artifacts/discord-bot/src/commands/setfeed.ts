import { Message, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { setStatusChannelId } from "../store.js";

export const name = "setfeed";
export const description = "Set the channel for live server status updates (Admin only)";

export async function execute(message: Message) {
  if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
    await message.reply("You need Administrator permission to use this command.");
    return;
  }

  // Allow !setfeed #channel or just !setfeed (uses current channel)
  const mentioned = message.mentions.channels.first();
  const target = mentioned ?? message.channel;

  if (!target || !("send" in target)) {
    await message.reply("Could not resolve a valid text channel.");
    return;
  }

  setStatusChannelId(target.id);

  const embed = new EmbedBuilder()
    .setTitle("✅ Status Feed Channel Set")
    .setDescription(`All live server updates will now be posted in <#${target.id}>.`)
    .setColor(0x57f287)
    .addFields({
      name: "What gets posted there",
      value: "• 30-second status embed\n• Player join/leave alerts\n• Server online/offline alerts",
    })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
