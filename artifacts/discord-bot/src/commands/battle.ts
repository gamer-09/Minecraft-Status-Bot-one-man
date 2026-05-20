import { Message, EmbedBuilder } from "discord.js";
import { getUser, saveUser, addCoins, hasEffect, consumeEffect } from "../store.js";

export const name = "battle";
export const description = "Challenge a user to a battle — !battle @user";

const COOLDOWN_MS = 30 * 60 * 1000;
const BASE_MIN = 60;
const BASE_MAX = 280;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function rng(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Flavor lines ─────────────────────────────────────────────────────────────

const WIN_LINES = [
  "unleashed the fury of a thousand creepers",
  "struck with a blade forged in the nether",
  "outsmarted their foe like a true realm strategist",
  "landed the killing blow with a diamond sword",
  "dodged every strike and countered from the shadows",
  "fought like a warrior carved from ancient bedrock",
  "summoned the strength of the elder guardian",
  "moved like a phantom through the smoke and ash",
  "called upon the ancient forge and struck true",
  "obliterated their opponent in a single devastating combo",
  "descended from the end portal like a god of war",
];

const LOSE_LINES = [
  "forgot to bring armour. Again.",
  "fell into lava mid-fight",
  "was no match for the challenger",
  "brought a wooden sword to a diamond fight",
  "was sent back to their spawn point",
  "got lost in the caves of defeat",
  "underestimated their foe and paid dearly",
  "collapsed like a dirt house in a storm",
  "got roasted harder than a nether fortress",
  "was left with nothing but a broken compass",
  "got mined like a coal vein — efficiently and mercilessly",
];

const CRIT_LINES = [
  "🗡️ **CRITICAL HIT** — the ancient runes aligned!",
  "🗡️ **CRITICAL STRIKE** — power surged beyond all limits!",
  "🗡️ **LETHAL BLOW** — the void itself trembled!",
];

const FUMBLE_LINES = [
  "💥 **FUMBLE** — their weapon slipped at the worst moment!",
  "💥 **STUMBLE** — tripped over their own enchantment!",
  "💥 **FUMBLE** — the ancient gods looked away in shame!",
];

const TIE_LINES = [
  "The powers are **perfectly matched**. Going to sudden death...",
  "Neither warrior yields. The realm demands a tiebreaker...",
  "The ancient stones tremble — the battle is too close to call...",
];

const MUTUAL_DESTRUCTION_LINES = [
  "Both warriors struck simultaneously. The explosion levelled the battlefield.",
  "They hit each other at the same moment. The realm claimed them both.",
  "A simultaneous strike. Nobody wins. The creepers are pleased.",
];

const DIVINE_LINES = [
  "⚡ **DIVINE INTERVENTION** — the gods reversed the outcome!",
  "⚡ **FATE INTERVENES** — the losing warrior is spared by ancient magic!",
  "⚡ **THE REALM DECIDES** — destiny overruled the dice!",
];

const JACKPOT_LINES = [
  "💎 **TREASURE VAULT DISCOVERED** — the reward is multiplied!",
  "💎 **ANCIENT BOUNTY** — the chest was full!",
  "💎 **DRAGON HOARD RAIDED** — coins overflow!",
];

const PITTANCE_LINES = [
  "🪨 The treasure chest was... mostly dirt.",
  "🪨 Slim pickings. The vault was nearly empty.",
  "🪨 The reward was modest. The realm is stingy today.",
];

// ─── Main command ─────────────────────────────────────────────────────────────

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
      embeds: [new EmbedBuilder().setTitle("⚔️  Hold on.").setDescription("You can't battle yourself.").setColor(0xe74c3c)],
    });
    return;
  }

  const challenger = getUser(message.author.id);
  const now = Date.now();
  if (challenger.battleCooldown && now < challenger.battleCooldown) {
    const remaining = Math.ceil((challenger.battleCooldown - now) / 60_000);
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("⚔️  Cooling Down")
          .setDescription(`You need to recover! Battle again in **${remaining} minute${remaining !== 1 ? "s" : ""}**.`)
          .setColor(0xe67e22),
      ],
    });
    return;
  }

  // ── Special event roll (checked before everything else) ──────────────────────
  const specialRoll = Math.random();

  // 2% — mutual destruction: both lose coins
  if (specialRoll < 0.02) {
    const loss = rng(20, 80);
    addCoins(message.author.id, -loss);
    addCoins(target.id, -loss);
    challenger.battleCooldown = now + COOLDOWN_MS;
    saveUser(message.author.id, challenger);

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("💥  Mutual Destruction")
          .setDescription(
            `**${message.author.username}** vs **${target.username}**\n\n` +
            `${pick(MUTUAL_DESTRUCTION_LINES)}\n\n` +
            `Both players lose **${loss} coins**.`
          )
          .setColor(0x2c2c2c)
          .setFooter({ text: "No winners today • 30 min cooldown" })
          .setTimestamp(),
      ],
    });
    return;
  }

  // ── Power rolls ───────────────────────────────────────────────────────────────
  let challengerPower = rng(1, 100);
  let targetPower = rng(1, 100);
  const events: string[] = [];

  // 8% crit for challenger
  if (Math.random() < 0.08) {
    challengerPower = Math.min(100, Math.floor(challengerPower * 1.6));
    events.push(`**${message.author.username}** — ${pick(CRIT_LINES)}`);
  }
  // 8% crit for target
  if (Math.random() < 0.08) {
    targetPower = Math.min(100, Math.floor(targetPower * 1.6));
    events.push(`**${target.username}** — ${pick(CRIT_LINES)}`);
  }
  // 6% fumble for challenger
  if (Math.random() < 0.06) {
    challengerPower = Math.max(1, Math.floor(challengerPower * 0.4));
    events.push(`**${message.author.username}** — ${pick(FUMBLE_LINES)}`);
  }
  // 6% fumble for target
  if (Math.random() < 0.06) {
    targetPower = Math.max(1, Math.floor(targetPower * 0.4));
    events.push(`**${target.username}** — ${pick(FUMBLE_LINES)}`);
  }

  // Tie: re-roll once as sudden death
  let tieBreaker = false;
  if (Math.abs(challengerPower - targetPower) <= 4) {
    tieBreaker = true;
    events.push(pick(TIE_LINES));
    challengerPower = rng(1, 100);
    targetPower = rng(1, 100);
    // Force a winner if still tied
    if (challengerPower === targetPower) challengerPower++;
  }

  let challengerWins = challengerPower >= targetPower;

  // 3% divine intervention: flip the result
  if (Math.random() < 0.03) {
    challengerWins = !challengerWins;
    events.push(pick(DIVINE_LINES));
  }

  const winnerId = challengerWins ? message.author.id : target.id;
  const loserId  = challengerWins ? target.id : message.author.id;
  const winner   = challengerWins ? message.author : target;
  const loser    = challengerWins ? target : message.author;

  // ── Shield ────────────────────────────────────────────────────────────────────
  const shieldUsed = hasEffect(loserId, "shield");
  if (shieldUsed) consumeEffect(loserId, "shield");

  // ── Reward ────────────────────────────────────────────────────────────────────
  let reward = rng(BASE_MIN, BASE_MAX);
  let rewardNote = "";

  const rewardRoll = Math.random();
  if (rewardRoll < 0.04) {
    // 4% jackpot: 3× reward
    reward = reward * 3;
    rewardNote = `\n${pick(JACKPOT_LINES)}`;
  } else if (rewardRoll < 0.10) {
    // 6% pittance: very small reward
    reward = rng(5, 25);
    rewardNote = `\n${pick(PITTANCE_LINES)}`;
  }

  const boosted = hasEffect(winnerId, "coinboost");
  if (boosted) {
    consumeEffect(winnerId, "coinboost");
    reward *= 2;
    rewardNote += "\n⚡ *Coin Boost applied — reward doubled!*";
  }

  const newBalance = addCoins(winnerId, reward);

  challenger.battleCooldown = now + COOLDOWN_MS;
  saveUser(message.author.id, challenger);

  // ── Build embed ───────────────────────────────────────────────────────────────
  const eventBlock = events.length > 0 ? `\n\n${events.join("\n")}` : "";
  const tieBlock   = tieBreaker ? "\n*Sudden death re-roll!*" : "";

  const embed = new EmbedBuilder()
    .setTitle("⚔️  Battle Result")
    .setDescription(
      `**${message.author.username}** *(${challengerPower} power)* ⚔️ **${target.username}** *(${targetPower} power)*` +
      tieBlock +
      eventBlock +
      `\n\n🏆 **${winner.username}** ${pick(WIN_LINES)}!\n` +
      `💔 **${loser.username}** ${pick(LOSE_LINES)}.`
    )
    .setColor(challengerWins ? 0x2ecc71 : 0xe74c3c)
    .addFields(
      {
        name: "💰 Reward",
        value: `**${winner.username}** earned **${reward} coins**${rewardNote}`,
      },
      { name: "👛 New Balance", value: `${newBalance.toLocaleString()} coins`, inline: true }
    )
    .setFooter({ text: "!shop to spend coins • !buy coinboost or shield to get an edge • 30 min cooldown" })
    .setTimestamp();

  if (shieldUsed) {
    embed.addFields({
      name: "🛡️ Shield Triggered",
      value: `**${loser.username}**'s Battle Shield was consumed — the coin loss was blocked!`,
    });
  }

  await message.reply({ embeds: [embed] });
}
