import { Message, EmbedBuilder } from "discord.js";

export const name = "roast";
export const description = "Roast a user — !roast @user";

const ROASTS = [
  "If brains were dynamite, you couldn't blow your hat off.",
  "You're the reason instructions exist.",
  "I'd agree with you, but then we'd both be wrong.",
  "You bring everyone so much joy — when you leave the room.",
  "I've seen better decisions made by a chicken crossing the road.",
  "Your WiFi signal is stronger than your game sense.",
  "You're like a software update — everyone ignores you.",
  "I'd call you a tool, but tools are useful.",
  "Even your shadow walks away from you sometimes.",
  "You're proof that even oxygen can be wasted.",
  "I'd roast you harder, but my mom said I can't burn trash.",
  "If life is a game, you're on easy mode and still losing.",
  "You're the loading screen nobody asked for.",
  "You have the energy of a dead battery.",
  "I've met rocks with more going on upstairs.",
];

export async function execute(message: Message) {
  const target = message.mentions.users.first();

  if (!target) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🔥  Roast — Usage")
          .setDescription("You need to mention someone to roast!\nExample: `!roast @user`")
          .setColor(0xe74c3c),
      ],
    });
    return;
  }

  if (target.id === message.client.user?.id) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🔥  Nice try.")
          .setDescription("I don't get roasted. I do the roasting.")
          .setColor(0xe67e22),
      ],
    });
    return;
  }

  if (target.id === message.author.id) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🔥  Self-roast detected")
          .setDescription("The fact that you roasted yourself tells me everything I need to know.")
          .setColor(0xe67e22),
      ],
    });
    return;
  }

  const roast = ROASTS[Math.floor(Math.random() * ROASTS.length)];

  const embed = new EmbedBuilder()
    .setTitle(`🔥  Roasting ${target.username}`)
    .setDescription(`<@${target.id}> — *${roast}*`)
    .setColor(0xe74c3c)
    .setFooter({ text: `Fired by ${message.author.username} • All roasts are in good fun!` })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
