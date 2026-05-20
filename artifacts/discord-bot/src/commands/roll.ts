import { Message, EmbedBuilder } from "discord.js";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const NARRATIONS = [
  "The ancient dice clatter across the stone floor...",
  "You reach into the void and pull out a number...",
  "The endermen watch as the dice rolls...",
  "Fate stirs in the deep dark...",
  "The nether trembles as the dice settles...",
  "The village elder observes in silence...",
  "A creeper nearby hisses with anticipation...",
];

const MAX_LINES = [
  "🎉 **MAXIMUM ROLL.** The gods are pleased.",
  "🎉 **CRITICAL.** The realm bows to you.",
  "🎉 **PERFECT.** Even the ender dragon is impressed.",
  "🎉 **MAX ROLL.** Fortune has chosen you.",
];

const MIN_LINES = [
  "💀 **MINIMUM ROLL.** Tragic.",
  "💀 **FUMBLE.** The void laughs.",
  "💀 **ONE.** Walk of shame.",
  "💀 **CRITICAL FAIL.** The endermen pity you.",
];

const MID_HIGH_LINES = [
  "Not bad. The fates nod in approval.",
  "A strong roll. The realm is satisfied.",
  "Higher than expected. Fortune smiles.",
  "Solid. Your ancestors are watching.",
];

const MID_LOW_LINES = [
  "Could be worse. Could definitely be better.",
  "Mediocre. Truly mediocre.",
  "The endermen shrug. So do we.",
  "The village elder looks disappointed.",
];

export const name = "roll";
export const description = "Roll a dice — !roll [sides] (default: 6)";

export async function execute(message: Message) {
  const args = message.content.trim().split(/\s+/);
  const sides = parseInt(args[1] ?? "6");

  if (isNaN(sides) || sides < 2 || sides > 1000) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌  Invalid Dice")
          .setDescription("Provide a number between **2** and **1000**.\nExample: `!roll 20`")
          .setColor(0xe74c3c),
      ],
    });
    return;
  }

  // Rare chance of a "cursed" roll that ignores normal range
  const cursed = Math.random() < 0.03;
  const result = cursed
    ? Math.random() < 0.5 ? 0 : sides + 1
    : Math.floor(Math.random() * sides) + 1;

  const isMax    = result >= sides;
  const isMin    = result <= 1;
  const isCursed = result === 0 || result === sides + 1;

  let flavour: string;
  let color: number;

  if (isCursed && result === 0) {
    flavour = "💀 **ZERO.** The dice rolled off the table and shattered.";
    color = 0x2c2c2c;
  } else if (isCursed) {
    flavour = "👁️ **BEYOND MAX.** This shouldn't be possible. Walk away.";
    color = 0x9b59b6;
  } else if (isMax) {
    flavour = pick(MAX_LINES);
    color = 0x2ecc71;
  } else if (isMin) {
    flavour = pick(MIN_LINES);
    color = 0xe74c3c;
  } else if (result / sides >= 0.7) {
    flavour = pick(MID_HIGH_LINES);
    color = 0x27ae60;
  } else if (result / sides <= 0.3) {
    flavour = pick(MID_LOW_LINES);
    color = 0xe67e22;
  } else {
    flavour = "";
    color = 0x9b59b6;
  }

  const embed = new EmbedBuilder()
    .setTitle("🎲  Dice Roll")
    .setDescription(
      `*${pick(NARRATIONS)}*\n\n` +
      `Rolling a **d${sides}**...\n\n## ${result}\n${flavour}`
    )
    .setColor(color)
    .setFooter({ text: `Rolled by ${message.author.username}` })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
