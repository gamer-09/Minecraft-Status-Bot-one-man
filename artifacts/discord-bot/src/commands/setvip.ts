import { Message, EmbedBuilder, PermissionFlagsBits, ChannelType, TextChannel } from "discord.js";
import { setVipChannelId } from "../store.js";

export const name = "setvip";
export const description = "Set the secret VIP channel unlocked by the 'holds the key' power tag (Admin only)";

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

  const mentioned = message.mentions.channels.first() as TextChannel | undefined;
  const target = mentioned ?? (message.channel as TextChannel);

  setVipChannelId(target.id);

  const embed = new EmbedBuilder()
    .setTitle("🔑  VIP Channel Set")
    .setDescription(
      `<#${target.id}> is now the secret VIP channel.\n\n` +
      `Members who buy the **holds the key** power tag will automatically get access to it.`
    )
    .setColor(0xe67e22)
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
