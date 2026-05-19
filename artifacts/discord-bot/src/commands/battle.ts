import { Message, EmbedBuilder } from "discord.js";
import { getUser, saveUser, addCoins, hasEffect, consumeEffect } from "../store.js";

export const name = "battle";
export const description = "Challenge a user to a battle — !battle @user";

const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
const BASE_REWARD_MIN = 80;
const BASE_REWARD_MAX = 250;

const WIN_LINES = [
  "unleashed a devastating combo",
  "struck with the fury of a thousand creepers",
  "outsmarted their opponent at every turn",
  "landed the final blow with a diamond sword",
  "emerged victorious after an epic clash",
  "dodged every attack and countered perfectly",
];

const LOSE_LINES = [
  "got completely demolished",
  "was no match for the challenger",
  "fell flat on their face",
  "forgot to bring their armour",
  "underestimated their opponent badly",
  "didn't stand a chance",
];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function execute(message: Message) {
  const target = message.mentions.users.first();

  if (!target) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("⚔️  Battle — Usage")
          .setDescription("Mention someone to challenge!\nExample: `!battle @user`")
          .setColor(0xe74c3c),
      ],
    });
    return;
  }

  if (target.bot) {
    await message.reply({
      embeds: [new EmbedBuilder().setTitle("⚔️  Nice try.").setDescription("You can't battle a bot.").setColor(0xe74c3c)],
    });
    return;
  }

  if (target.id === message.author.id) {
    await message.reply({
      embeds: [new EmbedBuilder().setTitle("⚔️  Hold on.").setDescription("You can't battle yourself!").setColor(0xe74c3c)],
    });
    return;
  }

  // Cooldown check
  const challenger = getUser(message.author.id);
  const now = Date.now();
  if (challenger.battleCooldown && now < challenger.battleCooldown) {
    const remaining = Math.ceil((challenger.battleCooldown - now) / 60_000);
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("⚔️  Cooldown")
          .setDescription(`You need to recover! You can battle again in **${remaining} minute${remaining !== 1 ? "s" : ""}**.`)
          .setColor(0xe67e22),
      ],
    });
    return;
  }

  // Determine winner
  const challengerPower = randomBetween(1, 100);
  const targetPower = randomBetween(1, 100);
  const challengerWins = challengerPower >= targetPower;

  const winnerId = challengerWins ? message.author.id : target.id;
  const loserId = challengerWins ? target.id : message.author.id;
  const winner = challengerWins ? message.author : target;
  const loser = challengerWins ? target : message.author;

  // Check loser's shield
  const shieldUsed = hasEffect(loserId, "shield");
  if (shieldUsed) {
    consumeEffect(loserId, "shield");
  }

  // Coin reward
  let reward = randomBetween(BASE_REWARD_MIN, BASE_REWARD_MAX);
  const boosted = hasEffect(winnerId, "coinboost");
  if (boosted) {
    consumeEffect(winnerId, "coinboost");
    reward *= 2;
  }
  const newBalance = addCoins(winnerId, reward);

  // Set challenger cooldown
  challenger.battleCooldown = now + COOLDOWN_MS;
  saveUser(message.author.id, challenger);

  const winLine = WIN_LINES[Math.floor(Math.random() * WIN_LINES.length)];
  const loseLine = LOSE_LINES[Math.floor(Math.random() * LOSE_LINES.length)];

  const embed = new EmbedBuilder()
    .setTitle("⚔️  Battle Result")
    .setDescription(
      `**${message.author.username}** *(${challengerPower} power)* vs **${target.username}** *(${targetPower} power)*\n\n` +
      `🏆 **${winner.username}** ${winLine}!\n` +
      `💔 **${loser.username}** ${loseLine}.`
    )
    .setColor(0xf1c40f)
    .addFields(
      {
        name: "💰 Reward",
        value: `**${winner.username}** earned **${reward} coins**${boosted ? " *(2× boost applied!)*" : ""}`,
        inline: true,
      },
      { name: "👛 New Balance", value: `${newBalance} coins`, inline: true }
    )
    .setTimestamp();

  if (shieldUsed) {
    embed.addFields({
      name: "🛡️ Shield Triggered",
      value: `**${loser.username}**'s Battle Shield was consumed — the loss was blocked!`,
    });
  }

  embed.setFooter({ text: "!balance to check your coins • !shop to spend them • 30 min cooldown between battles" });

  await message.reply({ embeds: [embed] });
}
