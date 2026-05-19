import { Message, EmbedBuilder } from "discord.js";

export const name = "rate";
export const description = "Rate anything out of 10";

const COMMENTS: Record<string, string[]> = {
  low: [
    "Absolute disaster. My condolences.",
    "Yikes. That's rough.",
    "Not even close. Try again.",
    "I've seen better on a Monday morning.",
    "That's... special. In all the wrong ways.",
  ],
  mid: [
    "Could be worse. Could be better. It just... is.",
    "Somewhere between meh and fine.",
    "A solid 'I've seen worse' from me.",
    "Room for improvement, but not a crime.",
    "The definition of average. Perfectly balanced.",
  ],
  high: [
    "Genuinely impressive. Respect.",
    "Now THAT'S something. Well done.",
    "Top tier. No notes.",
    "I didn't expect to be this impressed. Here we are.",
    "Peak. Absolute peak.",
  ],
  perfect: [
    "FLAWLESS. A masterpiece of our time.",
    "10/10, would recommend to everyone I know.",
    "The gods themselves have blessed this.",
  ],
};

export async function execute(message: Message) {
  const subject = message.content.slice("!rate".length).trim();

  if (!subject) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("⭐  Rate — Usage")
          .setDescription("Tell me what to rate!\nExample: `!rate pizza`")
          .setColor(0xe74c3c),
      ],
    });
    return;
  }

  const score = Math.floor(Math.random() * 11);
  const tier =
    score === 10 ? "perfect" : score >= 7 ? "high" : score >= 4 ? "mid" : "low";
  const pool = COMMENTS[tier];
  const comment = pool[Math.floor(Math.random() * pool.length)];

  const stars = "⭐".repeat(Math.max(1, Math.round(score / 2)));
  const color =
    score === 10 ? 0xf1c40f : score >= 7 ? 0x2ecc71 : score >= 4 ? 0xe67e22 : 0xe74c3c;

  const embed = new EmbedBuilder()
    .setTitle("⭐  Rating")
    .setDescription(`**${subject}**`)
    .setColor(color)
    .addFields(
      { name: "Score", value: `**${score}/10** ${stars}`, inline: true },
      { name: "Verdict", value: comment, inline: false }
    )
    .setFooter({ text: `Rated by the impartial judge • Requested by ${message.author.username}` })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
