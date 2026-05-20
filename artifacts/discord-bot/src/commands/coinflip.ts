import { Message, EmbedBuilder } from "discord.js";

const HEADS_LINES = [
  "The ancient coin gleams — **Heads**.",
  "It spins through the air... **Heads**. The fates smile.",
  "**Heads.** The realm has spoken.",
  "It clatters on the stone floor. **Heads.**",
  "**Heads.** Destiny favours you. For now.",
  "The coin refuses to fall easily... **Heads**.",
];

const TAILS_LINES = [
  "It tumbles into the dirt — **Tails**.",
  "**Tails.** The void claims this one.",
  "Spins... wobbles... **Tails**. Tough luck.",
  "**Tails.** The cursed side. Every time.",
  "It rolls off the table and somehow lands on **Tails**.",
  "**Tails.** Even the endermen saw that coming.",
];

const EDGE_LINES = [
  "...it lands on its **edge**. Nobody moves.",
  "The coin balances perfectly on its **edge**. This shouldn't be possible.",
  "**Edge.** An omen. Run.",
];

const VANISH_LINES = [
  "The coin flips into the air and... **disappears**. It's just gone.",
  "You flip the coin. It never comes back down. **Gone.**",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const name = "coinflip";
export const description = "Flip a coin — but beware rare outcomes";

export async function execute(message: Message) {
  const roll = Math.random();

  let title: string;
  let description: string;
  let color: number;
  let emoji: string;

  if (roll < 0.005) {
    // 0.5% — coin vanishes
    title = "✨  The Coin Vanished";
    description = pick(VANISH_LINES);
    color = 0x9b59b6;
    emoji = "✨";
  } else if (roll < 0.025) {
    // 2% — edge
    title = "⚠️  Edge";
    description = pick(EDGE_LINES);
    color = 0xe67e22;
    emoji = "⚠️";
  } else if (roll < 0.5125) {
    // ~48.75% — heads
    title = "🪙  Heads";
    description = pick(HEADS_LINES);
    color = 0xf1c40f;
    emoji = "🪙";
  } else {
    // ~48.75% — tails
    title = "🔵  Tails";
    description = pick(TAILS_LINES);
    color = 0x95a5a6;
    emoji = "🔵";
  }

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setFooter({ text: `Flipped by ${message.author.username}` })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
