import { Message, EmbedBuilder, PermissionFlagsBits, TextChannel } from "discord.js";
import { setShopChannelId } from "../store.js";

export const name = "setshop";
export const description = "Set the channel for the shop (Admin only) — !setshop #channel";

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

  setShopChannelId(target.id);

  const embed = new EmbedBuilder()
    .setTitle("🏪  Shop Channel Set")
    .setDescription(`The shop is now accessible in <#${target.id}>.\nMembers can use \`!shop\` only in that channel.`)
    .setColor(0x9b59b6)
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
