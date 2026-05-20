import { Message, EmbedBuilder } from "discord.js";
import { getBattleChannelId } from "../store.js";
import { getChallenge, removeChallenge, runBattle } from "../battleEngine.js";

export const name = "accept";
export const description = "Accept a pending battle challenge — !accept (battle channel only)";

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
          .setDescription("You don't have a pending battle challenge to accept.")
          .setColor(0x95a5a6),
      ],
    });
    return;
  }

  if (Date.now() > challenge.expiresAt) {
    removeChallenge(message.author.id);
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("⌛  Challenge Expired")
          .setDescription("That challenge has already expired.")
          .setColor(0x95a5a6),
      ],
    });
    return;
  }

  removeChallenge(message.author.id);

  await message.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("⚔️  Challenge Accepted!")
        .setDescription(
          `**${message.author.username}** has accepted **${challenge.challengerUsername}**'s challenge!\n\n` +
          `The battle has begun — both warriors have been sent to their private arena via DM.\n\n` +
          `*Results will be announced here when the battle ends.*`
        )
        .setColor(0x2ecc71)
        .addFields(
          { name: "⚔️ Challenger", value: challenge.challengerUsername, inline: true },
          { name: "🛡️ Defender", value: message.author.username, inline: true },
        )
        .setFooter({ text: "Check your DMs — you have 60 seconds per move!" })
        .setTimestamp(),
    ],
  });

  // Run the battle asynchronously so it doesn't block
  runBattle(challenge, message.client).catch((err) => {
    console.error("[battle] runBattle error:", err);
  });
}
