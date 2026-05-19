import { Message, EmbedBuilder } from "discord.js";

export const name = "8ball";
export const description = "Ask the magic 8-ball a yes/no question";

const RESPONSES = [
  { text: "It is certain.", type: "yes" },
  { text: "It is decidedly so.", type: "yes" },
  { text: "Without a doubt.", type: "yes" },
  { text: "Yes, definitely.", type: "yes" },
  { text: "You may rely on it.", type: "yes" },
  { text: "As I see it, yes.", type: "yes" },
  { text: "Most likely.", type: "yes" },
  { text: "Outlook good.", type: "yes" },
  { text: "Yes.", type: "yes" },
  { text: "Signs point to yes.", type: "yes" },
  { text: "Reply hazy, try again.", type: "neutral" },
  { text: "Ask again later.", type: "neutral" },
  { text: "Better not tell you now.", type: "neutral" },
  { text: "Cannot predict now.", type: "neutral" },
  { text: "Concentrate and ask again.", type: "neutral" },
  { text: "Don't count on it.", type: "no" },
  { text: "My reply is no.", type: "no" },
  { text: "My sources say no.", type: "no" },
  { text: "Outlook not so good.", type: "no" },
  { text: "Very doubtful.", type: "no" },
];

export async function execute(message: Message) {
  const question = message.content.slice("!8ball".length).trim();

  if (!question) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🎱  Magic 8-Ball")
          .setDescription("You need to ask a question!\nExample: `!8ball Will the server be online today?`")
          .setColor(0xe74c3c),
      ],
    });
    return;
  }

  const response = RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
  const color = response.type === "yes" ? 0x2ecc71 : response.type === "no" ? 0xe74c3c : 0x95a5a6;
  const emoji = response.type === "yes" ? "✅" : response.type === "no" ? "❌" : "🔮";

  const embed = new EmbedBuilder()
    .setTitle("🎱  Magic 8-Ball")
    .addFields(
      { name: "❓ Question", value: question },
      { name: `${emoji} Answer`, value: `*${response.text}*` }
    )
    .setColor(color)
    .setFooter({ text: `Asked by ${message.author.username}` })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
