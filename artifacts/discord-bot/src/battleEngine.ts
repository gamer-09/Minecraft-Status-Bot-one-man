import {
  Client,
  EmbedBuilder,
  TextChannel,
  DMChannel,
  Message,
} from "discord.js";
import { addCoins, hasEffect, consumeEffect, recordBattleWin, recordBattleLoss, recordBattleDraw } from "./store.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MoveKey = "1" | "2" | "3" | "4";

export interface Fighter {
  userId: string;
  username: string;
  hp: number;
  usedSpecial: boolean;
}

export interface PendingChallenge {
  challengerId: string;
  challengerUsername: string;
  targetId: string;
  channelId: string;
  guildId: string;
  expiresAt: number;
}

// ─── In-memory state ──────────────────────────────────────────────────────────

// targetId → challenge
const pending = new Map<string, PendingChallenge>();
// userId → true (either fighter)
const inBattle = new Map<string, true>();

export function createChallenge(c: PendingChallenge): void {
  pending.set(c.targetId, c);
}

export function getChallenge(targetId: string): PendingChallenge | undefined {
  return pending.get(targetId);
}

export function removeChallenge(targetId: string): void {
  pending.delete(targetId);
}

export function isBusy(userId: string): boolean {
  if (inBattle.has(userId)) return true;
  for (const c of pending.values()) {
    if (c.challengerId === userId || c.targetId === userId) return true;
  }
  return false;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rng(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hpBar(hp: number, max = 100): string {
  const filled = Math.max(0, Math.round((hp / max) * 10));
  return "█".repeat(filled) + "░".repeat(10 - filled) + ` **${Math.max(0, hp)}/${max} HP**`;
}

const MOVE_LABELS: Record<MoveKey, string> = {
  "1": "⚔️ Attack",
  "2": "🪓 Heavy Attack",
  "3": "🛡️ Defend",
  "4": "✨ Special",
};

// ─── Move collection via DM ───────────────────────────────────────────────────

async function getDmChannel(client: Client, userId: string): Promise<DMChannel | null> {
  try {
    const user = await client.users.fetch(userId);
    return await user.createDM();
  } catch {
    return null;
  }
}

function buildMovePrompt(self: Fighter, opp: Fighter, turn: number, specialUsed: boolean): string {
  const specialNote = specialUsed ? " *(used)*" : " *(one-time, massive damage)*";
  return [
    `⚔️ **Turn ${turn}** — Choose your move by typing the number:`,
    "",
    `\`1\` ⚔️  **Attack**        — 15-25 damage`,
    `\`2\` 🪓  **Heavy Attack**  — 30-50 damage, 35% miss chance`,
    `\`3\` 🛡️  **Defend**        — Halves incoming damage + counter`,
    `\`4\` ✨  **Special Move**${specialNote}  — 55-75 damage`,
    "",
    `📊 **Your HP:**  ${hpBar(self.hp)}`,
    `📊 **${opp.username}:**  ${hpBar(opp.hp)}`,
    "",
    `*You have 60 seconds to reply with 1, 2, 3, or 4.*`,
  ].join("\n");
}

async function collectMove(
  dm: DMChannel,
  userId: string,
  prompt: string
): Promise<MoveKey> {
  await dm.send(prompt);

  return new Promise((resolve) => {
    const filter = (m: Message) =>
      m.author.id === userId && ["1", "2", "3", "4"].includes(m.content.trim());
    const collector = dm.createMessageCollector({ filter, max: 1, time: 60_000 });
    collector.on("collect", (m) => resolve(m.content.trim() as MoveKey));
    collector.on("end", (collected) => {
      if (collected.size === 0) resolve("1"); // timeout → default Attack
    });
  });
}

// ─── Turn resolution ──────────────────────────────────────────────────────────

interface TurnResult {
  dmgToA: number;
  dmgToB: number;
  aMissed: boolean;
  bMissed: boolean;
  aSpecialFired: boolean;
  bSpecialFired: boolean;
}

function resolveTurn(
  moveA: MoveKey,
  fighterA: Fighter,
  moveB: MoveKey,
  fighterB: Fighter
): TurnResult {
  let rawToB = 0;
  let rawToA = 0;
  let aMissed = false;
  let bMissed = false;
  let aSpecialFired = false;
  let bSpecialFired = false;

  // A attacks B
  if (moveA === "1") rawToB = rng(15, 25);
  else if (moveA === "2") {
    if (Math.random() < 0.35) { aMissed = true; rawToB = 0; }
    else rawToB = rng(30, 50);
  } else if (moveA === "3") {
    rawToB = 0;
  } else if (moveA === "4") {
    if (!fighterA.usedSpecial) { aSpecialFired = true; rawToB = rng(55, 75); }
    else rawToB = rng(15, 25); // already used → fallback attack
  }

  // B attacks A
  if (moveB === "1") rawToA = rng(15, 25);
  else if (moveB === "2") {
    if (Math.random() < 0.35) { bMissed = true; rawToA = 0; }
    else rawToA = rng(30, 50);
  } else if (moveB === "3") {
    rawToA = 0;
  } else if (moveB === "4") {
    if (!fighterB.usedSpecial) { bSpecialFired = true; rawToA = rng(55, 75); }
    else rawToA = rng(15, 25);
  }

  let finalToA = rawToA;
  let finalToB = rawToB;

  // Apply defend modifiers
  if (moveA === "3" && moveB !== "3") {
    // A defending: halve damage, add counter if B actually hit
    finalToA = Math.floor(rawToA * 0.5);
    if (rawToA > 0 && !bMissed) finalToB += rng(5, 12);
  }
  if (moveB === "3" && moveA !== "3") {
    finalToB = Math.floor(rawToB * 0.5);
    if (rawToB > 0 && !aMissed) finalToA += rng(5, 12);
  }
  // Both defending: tiny chip damage
  if (moveA === "3" && moveB === "3") {
    finalToA = rng(3, 7);
    finalToB = rng(3, 7);
  }

  return { dmgToA: finalToA, dmgToB: finalToB, aMissed, bMissed, aSpecialFired, bSpecialFired };
}

function buildTurnReport(
  fa: Fighter, fb: Fighter,
  moveA: MoveKey, moveB: MoveKey,
  result: TurnResult,
  perspectiveIsA: boolean,
  turn: number
): string {
  const self = perspectiveIsA ? fa : fb;
  const opp  = perspectiveIsA ? fb : fa;
  const selfMove   = perspectiveIsA ? moveA : moveB;
  const oppMove    = perspectiveIsA ? moveB : moveA;
  const dmgTaken   = perspectiveIsA ? result.dmgToA : result.dmgToB;
  const dmgDealt   = perspectiveIsA ? result.dmgToB : result.dmgToA;
  const selfMissed = perspectiveIsA ? result.aMissed : result.bMissed;
  const oppMissed  = perspectiveIsA ? result.bMissed : result.aMissed;

  const newSelfHp = Math.max(0, self.hp - dmgTaken);
  const newOppHp  = Math.max(0, opp.hp  - dmgDealt);

  const lines: string[] = [
    `📋 **Turn ${turn} Result**`,
    "",
    `You chose: **${MOVE_LABELS[selfMove]}**   |   ${opp.username} chose: **${MOVE_LABELS[oppMove]}**`,
    "",
  ];

  if (selfMissed) lines.push(`💨 Your attack **missed**!`);
  else if (dmgDealt > 0) lines.push(`💥 You dealt **${dmgDealt} damage** to ${opp.username}.`);
  else if (selfMove === "3") lines.push(`🛡️ You braced for impact.`);

  if (oppMissed) lines.push(`💨 ${opp.username}'s attack **missed**!`);
  else if (dmgTaken > 0) lines.push(`🩸 You took **${dmgTaken} damage**.`);
  else if (oppMove === "3") lines.push(`🛡️ ${opp.username} defended.`);

  lines.push("", `📊 **Your HP:**    ${hpBar(newSelfHp)}`);
  lines.push(`📊 **${opp.username}:** ${hpBar(newOppHp)}`);

  return lines.join("\n");
}

// ─── Main battle runner ───────────────────────────────────────────────────────

const WIN_LINES = [
  "struck the killing blow with diamond precision",
  "called upon the elder guardian and crushed their foe",
  "moved like a phantom and dominated the arena",
  "summoned the strength of the nether and triumphed",
  "descended from the End like a god of war",
  "outlasted their opponent through sheer will and power",
];

const LOSE_LINES = [
  "fell in battle, respawning with bruised pride",
  "was outmatched from the very first swing",
  "underestimated their foe and paid the price",
  "fought hard but the realm was not on their side",
  "collapsed like a dirt house in a storm",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function runBattle(
  challenge: PendingChallenge,
  client: Client
): Promise<void> {
  const { challengerId, targetId, channelId, guildId } = challenge;

  inBattle.set(challengerId, true);
  inBattle.set(targetId, true);

  const [challUser, targUser] = await Promise.all([
    client.users.fetch(challengerId),
    client.users.fetch(targetId),
  ]);

  const fa: Fighter = { userId: challengerId, username: challUser.username, hp: 100, usedSpecial: false };
  const fb: Fighter = { userId: targetId,     username: targUser.username,  hp: 100, usedSpecial: false };

  const [dmA, dmB] = await Promise.all([
    getDmChannel(client, challengerId),
    getDmChannel(client, targetId),
  ]);

  const noDmError = new EmbedBuilder()
    .setTitle("❌ Battle Cancelled")
    .setDescription("A player's DMs are closed — the battle could not begin.")
    .setColor(0xe74c3c);

  // Get the announcement channel
  let announceChannel: TextChannel | null = null;
  try {
    const ch = await client.channels.fetch(channelId);
    if (ch && ch.isTextBased() && !ch.isDMBased()) {
      announceChannel = ch as TextChannel;
    }
  } catch { /* ignore */ }

  if (!dmA || !dmB) {
    inBattle.delete(challengerId);
    inBattle.delete(targetId);
    if (announceChannel) await announceChannel.send({ embeds: [noDmError] }).catch(() => null);
    return;
  }

  // Intro DMs
  const introMsg = (opp: string) =>
    `⚔️ **Your battle against ${opp} has begun!**\n\nYou each have **100 HP**. Choose your moves each round — your opponent cannot see your choice.\n\nGood luck, warrior.`;

  await Promise.all([
    dmA.send(introMsg(fb.username)),
    dmB.send(introMsg(fa.username)),
  ]);

  const MAX_TURNS = 12;

  for (let turn = 1; turn <= MAX_TURNS; turn++) {
    const promptA = buildMovePrompt(fa, fb, turn, fa.usedSpecial);
    const promptB = buildMovePrompt(fb, fa, turn, fb.usedSpecial);

    const [moveA, moveB] = await Promise.all([
      collectMove(dmA, challengerId, promptA),
      collectMove(dmB, targetId, promptB),
    ]);

    const result = resolveTurn(moveA, fa, moveB, fb);

    if (result.aSpecialFired) fa.usedSpecial = true;
    if (result.bSpecialFired) fb.usedSpecial = true;

    fa.hp -= result.dmgToA;
    fb.hp -= result.dmgToB;

    const reportA = buildTurnReport(fa, fb, moveA, moveB, result, true,  turn);
    const reportB = buildTurnReport(fa, fb, moveA, moveB, result, false, turn);

    const battleOver = fa.hp <= 0 || fb.hp <= 0;

    if (battleOver) {
      await Promise.all([
        dmA.send(reportA + "\n\n*⚔️ The battle is over — check the battle channel for the result!*"),
        dmB.send(reportB + "\n\n*⚔️ The battle is over — check the battle channel for the result!*"),
      ]);
      break;
    }

    await Promise.all([dmA.send(reportA), dmB.send(reportB)]);
  }

  // ── Determine winner ──────────────────────────────────────────────────────────
  let winnerId: string;
  let loserId: string;
  let winnerName: string;
  let loserName: string;
  let isDraw = false;

  if (fa.hp > fb.hp) {
    winnerId = challengerId; loserId = targetId;
    winnerName = fa.username; loserName = fb.username;
  } else if (fb.hp > fa.hp) {
    winnerId = targetId; loserId = challengerId;
    winnerName = fb.username; loserName = fa.username;
  } else {
    isDraw = true;
    winnerId = challengerId; loserId = targetId;
    winnerName = fa.username; loserName = fb.username;
  }

  // ── Reward ────────────────────────────────────────────────────────────────────
  let reward = 0;
  let rewardNote = "";
  const shieldUsed = hasEffect(loserId, "shield");

  if (!isDraw) {
    reward = Math.floor(Math.random() * (280 - 60 + 1)) + 60;
    const rewardRoll = Math.random();
    if (rewardRoll < 0.04) {
      reward *= 3;
      rewardNote = "\n💎 **DRAGON HOARD RAIDED** — reward tripled!";
    } else if (rewardRoll < 0.10) {
      reward = rng(5, 25);
      rewardNote = "\n🪨 *The vault was nearly empty...*";
    }
    if (hasEffect(winnerId, "coinboost")) {
      consumeEffect(winnerId, "coinboost");
      reward *= 2;
      rewardNote += "\n⚡ *Coin Boost applied — doubled!*";
    }
    if (shieldUsed) consumeEffect(loserId, "shield");
    addCoins(winnerId, reward);
    recordBattleWin(winnerId, reward);
    recordBattleLoss(loserId);
  } else {
    recordBattleDraw(challengerId);
    recordBattleDraw(targetId);
  }

  // ── Cooldown ──────────────────────────────────────────────────────────────────
  const COOLDOWN_MS = 30 * 60 * 1000;
  const now = Date.now();
  const { getUser, saveUser } = await import("./store.js");
  const cData = getUser(challengerId);
  cData.battleCooldown = now + COOLDOWN_MS;
  saveUser(challengerId, cData);

  // ── Announcement embed ────────────────────────────────────────────────────────
  if (announceChannel) {
    const embed = new EmbedBuilder()
      .setTitle("⚔️  Battle Over — Arena Report")
      .setColor(isDraw ? 0xe67e22 : 0x2ecc71)
      .setTimestamp()
      .setFooter({ text: "30 min cooldown • !shop to spend coins" });

    if (isDraw) {
      embed.setDescription(
        `**${fa.username}** ⚔️ **${fb.username}**\n\n` +
        `The warriors fought to a **draw** — both left standing, neither triumphant.\n\n` +
        `Final HP — **${fa.username}:** ${Math.max(0, fa.hp)} | **${fb.username}:** ${Math.max(0, fb.hp)}`
      );
    } else {
      embed.setDescription(
        `**${fa.username}** ⚔️ **${fb.username}**\n\n` +
        `🏆 **${winnerName}** ${pick(WIN_LINES)}!\n` +
        `💔 **${loserName}** ${pick(LOSE_LINES)}.`
      );
      embed.addFields(
        { name: "💰 Reward", value: `**${winnerName}** earned **${reward} coins**${rewardNote}` },
        { name: "❤️ Final HP", value: `${fa.username}: ${Math.max(0, fa.hp)} | ${fb.username}: ${Math.max(0, fb.hp)}`, inline: true }
      );
      if (shieldUsed) {
        embed.addFields({ name: "🛡️ Shield Triggered", value: `**${loserName}**'s Battle Shield blocked the coin loss!` });
      }
    }

    await announceChannel.send({ embeds: [embed] }).catch(() => null);
  }

  inBattle.delete(challengerId);
  inBattle.delete(targetId);
}
