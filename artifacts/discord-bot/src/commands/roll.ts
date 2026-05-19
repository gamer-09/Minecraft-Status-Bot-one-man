import { Message, EmbedBuilder } from "discord.js";

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
          .setDescription("Please provide a number between **2** and **1000**.\nExample: `!roll 20`")
          .setColor(0xe74c3c),
      ],
    });
    return;
  }

  const result = Math.floor(Math.random() * sides) + 1;
  const isMax = result === sides;
  const isMin = result === 1;

  const embed = new EmbedBuilder()
    .setTitle("🎲  Dice Roll")
    .setDescription(
      `Rolling a **d${sides}**...\n\n` +
      `## ${result}\n` +
      (isMax ? "🎉 **Maximum roll! Lucky!**" : isMin ? "💀 **Minimum roll. Ouch.**" : "")
    )
    .setColor(isMax ? 0x2ecc71 : isMin ? 0xe74c3c : 0x9b59b6)
    .setFooter({ text: `Rolled by ${message.author.username}` })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
