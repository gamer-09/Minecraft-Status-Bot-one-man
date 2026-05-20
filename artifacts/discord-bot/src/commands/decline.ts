import { Message, EmbedBuilder } from "discord.js";
import { getBattleChannelId } from "../store.js";
import { getChallenge, removeChallenge } from "../battleEngine.js";

export const name = "decline";
export const description = "Decline a pending battle challenge — !decline (battle channel only)";

export async function execute(message: Message) {
  const battleChannelId = getBattleChannelId();

  if (!battleChannelId || message.channel.id !== battleChannelId) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("⚔️  Wrong Channel")
          .setDescription(battleChannelId ? `Battle commands only work in <#${battleChannelId}>.` : "No battle arena has been set up yet.")
          .setColor(0xe74c3c),
      ],
    });
    return;
  }

  const challenge = getChallenge(message.author.id);

  if (!challenge) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("❓  No Challenge Found")
          .setDescription("You don't have a pending battle challenge to decline.")
          .setColor(0x95a5a6),
      ],
    });
    return;
  }

  removeChallenge(message.author.id);

  await message.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("🚪  Challenge Declined")
        .setDescription(
          `**${message.author.username}** has declined **${challenge.challengerUsername}**'s challenge.\n\n` +
          `Perhaps another time, warrior.`
        )
        .setColor(0x95a5a6)
        .setTimestamp(),
    ],
  });
}
