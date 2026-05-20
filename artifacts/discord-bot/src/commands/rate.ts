import { Message, EmbedBuilder } from "discord.js";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const COMMENTS: Record<string, string[]> = {
  zero: [
    "A new low. Historians will study this.",
    "The void itself rated this a 0. I agree.",
    "I have witnessed true emptiness.",
    "Not even the endermen would touch this.",
    "The ancient scrolls did not foretell this level of failure.",
  ],
  low: [
    "Absolute disaster. My condolences.",
    "The elder guardian has seen better.",
    "Even a dirt hut has more going for it.",
    "The nether would reject this.",
    "I've seen creepers with more promise.",
    "That's rough. Like mining without a pickaxe.",
    "The bones of fallen miners weep.",
  ],
  mid: [
    "Could be worse. Could be better. It just... exists.",
    "Somewhere between coal and iron. Unremarkable.",
    "A solid 'I've seen worse' from the village elder.",
    "The definition of average. Like a plains biome.",
    "Neither blessed nor cursed. Just... there.",
    "The ancient ones are neither pleased nor angered.",
  ],
  high: [
    "Genuinely impressive. The realm nods.",
    "Strong. Like a fortress built of obsidian.",
    "Top tier. The dragon bows.",
    "I didn't expect to be this impressed. Here we are.",
    "The ancient forges would approve.",
    "Even the endermen acknowledge this.",
  ],
  perfect: [
    "FLAWLESS. The gods carved this into stone.",
    "10/10. The ender dragon itself rates this perfect.",
    "A masterpiece carved into the oldest bedrock.",
    "The ancient realm has never seen better.",
  ],
  eleven: [
    "**11/10.** Reality itself has been broken.",
    "**11/10.** The number scale was not enough.",
    "**BEYOND RATING.** The ancient gods are speechless.",
  ],
  negative: [
    "**-1/10.** It somehow made things worse.",
    "**-2/10.** A negative score. You've broken the scale.",
  ],
};

// Weighted random: biased toward extremes for unpredictability
function rollScore(): number {
  const r = Math.random();
  if (r < 0.03) return -1;          // 3% negative
  if (r < 0.06) return 11;          // 3% eleven
  if (r < 0.10) return 0;           // 4% zero
  if (r < 0.20) return 10;          // 10% perfect
  if (r < 0.32) return Math.floor(Math.random() * 3) + 1;   // 12% low (1-3)
  if (r < 0.52) return Math.floor(Math.random() * 3) + 4;   // 20% mid (4-6)
  return Math.floor(Math.random() * 3) + 7;                  // 48% high (7-9)
}

// Special overrides for certain keywords
const KEYWORD_OVERRIDES: { pattern: RegExp; score: number }[] = [
  { pattern: /minecraft/i, score: 10 },
  { pattern: /creeper/i,   score: 10 },
  { pattern: /ender dragon/i, score: 10 },
  { pattern: /dirt\s*house/i, score: 1 },
  { pattern: /monday/i,    score: 2 },
];

export const name = "rate";
export const description = "Rate anything out of 10 — results may surprise you";

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

  let score = rollScore();

  // Apply keyword overrides
  for (const { pattern, score: forced } of KEYWORD_OVERRIDES) {
    if (pattern.test(subject)) { score = forced; break; }
  }

  let tier: keyof typeof COMMENTS;
  let displayScore: string;
  let color: number;
  let stars: string;

  if (score === -1 || score < 0) {
    tier = "negative"; displayScore = `${score}/10`; color = 0x2c2c2c; stars = "💀";
  } else if (score === 11) {
    tier = "eleven";   displayScore = "11/10";        color = 0x9b59b6; stars = "⭐⭐⭐⭐⭐✨";
  } else if (score === 0) {
    tier = "zero";     displayScore = "0/10";          color = 0x2c2c2c; stars = "💀";
  } else if (score === 10) {
    tier = "perfect";  displayScore = "10/10";         color = 0xf1c40f; stars = "⭐⭐⭐⭐⭐";
  } else if (score >= 7) {
    tier = "high";     displayScore = `${score}/10`;   color = 0x2ecc71; stars = "⭐".repeat(Math.round(score / 2));
  } else if (score >= 4) {
    tier = "mid";      displayScore = `${score}/10`;   color = 0xe67e22; stars = "⭐".repeat(Math.round(score / 2));
  } else {
    tier = "low";      displayScore = `${score}/10`;   color = 0xe74c3c; stars = "⭐".repeat(Math.max(1, Math.round(score / 2)));
  }

  const comment = pick(COMMENTS[tier]);

  const embed = new EmbedBuilder()
    .setTitle("⭐  The Verdict")
    .setDescription(`**${subject}**`)
    .setColor(color)
    .addFields(
      { name: "Score", value: `**${displayScore}** ${stars}`, inline: true },
      { name: "Verdict", value: comment, inline: false }
    )
    .setFooter({ text: `Judged by the ancient council • Requested by ${message.author.username}` })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
