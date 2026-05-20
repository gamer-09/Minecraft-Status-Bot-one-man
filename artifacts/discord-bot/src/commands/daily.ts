import { Message, EmbedBuilder } from "discord.js";
import { claimDaily } from "../store.js";
import { checkLeaderboardUpdate } from "../leaderboardWatcher.js";

export const name = "daily";
export const description = "Claim your daily coin reward — !daily";

const DAILY_MESSAGES = [
  "The realm rewards your loyalty.",
  "The ancient forge gifts you coins.",
  "A chest was found on the road to battle.",
  "The dragon dropped some coins on his way out.",
  "The nether gave up its riches. Today.",
  "The village trader left something behind.",
  "Fortune smiles on the persistent warrior.",
];

export async function execute(message: Message) {
  const result = claimDaily(message.author.id);

  if (!result.granted) {
    const nextTimestamp = Math.floor(result.nextAt / 1000);
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("⏳  Already Claimed")
          .setDescription(
            `You've already collected today's reward.\n\nCome back <t:${nextTimestamp}:R>.`
          )
          .setColor(0xe67e22)
          .setFooter({ text: "Daily rewards reset every 24 hours" })
          .setTimestamp(),
      ],
    });
    return;
  }

  const flavor = DAILY_MESSAGES[Math.floor(Math.random() * DAILY_MESSAGES.length)];

  await message.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("🎁  Daily Reward Claimed!")
        .setDescription(`*${flavor}*\n\nYou received **${result.reward} coins** 🪙`)
        .setColor(0xf1c40f)
        .setFooter({ text: "Come back tomorrow for your next reward • !battle to earn more" })
        .setTimestamp(),
    ],
  });

  checkLeaderboardUpdate(message.client).catch(() => null);
}
