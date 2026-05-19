import { Message, EmbedBuilder } from "discord.js";

export const name = "coinflip";
export const description = "Flip a coin — heads or tails?";

export async function execute(message: Message) {
  const result = Math.random() < 0.5 ? "Heads" : "Tails";
  const emoji = result === "Heads" ? "🪙" : "🔵";

  const embed = new EmbedBuilder()
    .setTitle(`${emoji}  Coin Flip`)
    .setDescription(`The coin landed on... **${result}**!`)
    .setColor(result === "Heads" ? 0xf1c40f : 0x95a5a6)
    .setFooter({ text: `Flipped by ${message.author.username}` })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
