import { Message, EmbedBuilder } from "discord.js";

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const ROASTS = [
  // General
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
  "You're not the dumbest person alive, but you better hope they don't die.",
  "I'd say you're one in a million, but that's not the compliment you think it is.",
  "Your secrets are safe with me — I never listen when you talk.",
  "I thought of you today. It reminded me to take out the trash.",
  "You're like a cloud. When you disappear, it's a beautiful day.",
  // Minecraft themed
  "You mine straight down and wonder why things go wrong.",
  "You're the kind of player who punches trees for an hour and calls it progress.",
  "You built a dirt house and called it a mansion.",
  "You've died to fall damage more times than you've slept through the night.",
  "The creepers blow themselves up out of pity when they see you.",
  "You forgot to set your spawn point. Again.",
  "You're the reason the village burned.",
  "Even the endermen won't look at you — and that's their whole thing.",
  "You've been lost in the same cave for three in-game days.",
  "You traded all your diamonds to a villager for a piece of bread.",
  "You have a full stack of dirt and think you're ready for the End.",
  "Your hotbar says a lot. None of it is good.",
  "The elder guardian gave you Mining Fatigue out of pure instinct.",
  "You're the one who opened the nether portal without obsidian.",
  "The ancient stronghold crumbled rather than be found by you.",
  "You brought a wooden sword to a wither fight.",
  "You tried to tame an enderman. Twice.",
  "A skeleton with no arrows is still a better fighter than you.",
  // Ancient/fantasy themed
  "The ancient scrolls foretold your arrival. They immediately burst into flames.",
  "Even the void doesn't want you.",
  "You were forged in a dirt forge, and it shows.",
  "The realm's worst adventurer has been found, and it is you.",
  "The elder council reviewed your life choices. They wept.",
  "You couldn't find your way out of the overworld with a compass and a map.",
  "Legends are written about warriors. You inspire warning signs.",
  "The nether fortress crumbled before you could embarrass yourself inside it.",
];

// Rare outcomes
const BACKFIRE_ROASTS = [
  "Actually... you know what, I can't. You're genuinely a good person. Roast cancelled.",
  "I tried to think of something and just... couldn't. Rare W for you.",
  "The roast machine is broken. You escape this one.",
];

const REDIRECT_ROASTS = [
  "You asked me to roast them, but honestly? Look in a mirror first.",
  "Bold of you to request a roast when you're right there.",
  "The real roast was the requester all along.",
];

export const name = "roast";
export const description = "Roast a user — !roast @user";

export async function execute(message: Message) {
  const target = message.mentions.users.first();

  if (!target) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🔥  Roast — Usage")
          .setDescription("Mention someone to roast!\nExample: `!roast @user`")
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

  const roll = Math.random();

  // 4% — roast backfires, target gets a compliment
  if (roll < 0.04) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`🔥  Roast Backfired on ${message.author.username}`)
          .setDescription(
            `<@${target.id}> — *${pick(BACKFIRE_ROASTS)}*\n\n` +
            `<@${message.author.id}> — you tried.`
          )
          .setColor(0x2ecc71)
          .setFooter({ text: "Sometimes the universe protects the innocent" })
          .setTimestamp(),
      ],
    });
    return;
  }

  // 6% — roast redirected back at requester
  if (roll < 0.10) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`🔥  Roast Redirected`)
          .setDescription(
            `<@${message.author.id}> — *${pick(REDIRECT_ROASTS)}*`
          )
          .setColor(0xe67e22)
          .setFooter({ text: "The fire turns back on itself" })
          .setTimestamp(),
      ],
    });
    return;
  }

  const roast = pick(ROASTS);

  const embed = new EmbedBuilder()
    .setTitle(`🔥  Roasting ${target.username}`)
    .setDescription(`<@${target.id}> — *${roast}*`)
    .setColor(0xe74c3c)
    .setFooter({ text: `Fired by ${message.author.username} • All roasts are in good fun` })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
