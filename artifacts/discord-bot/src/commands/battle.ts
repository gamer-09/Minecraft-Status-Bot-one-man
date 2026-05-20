import { Message, EmbedBuilder } from "discord.js";
import { getBattleChannelId, getUser } from "../store.js";
import { createChallenge, isBusy, getChallenge, removeChallenge } from "../battleEngine.js";

export const name = "battle";
export const description = "Challenge someone to a turn-based battle — !battle @user (battle channel only)";

const CHALLENGE_TTL_MS = 90_000;

export async function execute(message: Message) {
  // ── Enforce battle channel ─────────────────────────────────────────────────
  const battleChannelId = getBattleChannelId();
  if (!battleChannelId) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("⚔️  No Battle Arena Set")
          .setDescription("An admin needs to run `!setbattle #channel` to designate a battle arena first.")
          .setColor(0xe67e22),
      ],
    });
    return;
  }

  if (message.channel.id !== battleChannelId) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("⚔️  Wrong Channel")
          .setDescription(`Battles can only be started in <#${battleChannelId}>.\nHead there to challenge someone!`)
          .setColor(0xe74c3c),
      ],
    });
    return;
  }

  // ── Validate target ────────────────────────────────────────────────────────
  const target = message.mentions.users.first();
  if (!target) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("⚔️  Challenge — Usage")
          .setDescription("Mention a warrior to challenge!\nExample: `!battle @user`")
          .setColor(0xe74c3c),
      ],
    });
    return;
  }

  if (target.bot) {
    await message.reply({
      embeds: [new EmbedBuilder().setTitle("⚔️  Nice try.").setDescription("Bots don't fight.").setColor(0xe74c3c)],
    });
    return;
  }

  if (target.id === message.author.id) {
    await message.reply({
      embeds: [new EmbedBuilder().setTitle("⚔️  Hold on.").setDescription("You can't battle yourself.").setColor(0xe74c3c)],
    });
    return;
  }

  // ── Cooldown check ─────────────────────────────────────────────────────────
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

  // ── Busy check ─────────────────────────────────────────────────────────────
  if (isBusy(message.author.id)) {
    await message.reply({
      embeds: [new EmbedBuilder().setTitle("⚔️  Already in Combat").setDescription("You are already in a battle or have a pending challenge.").setColor(0xe67e22)],
    });
    return;
  }

  if (isBusy(target.id)) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("⚔️  Opponent Busy")
          .setDescription(`**${target.username}** is already in a battle or has a pending challenge.`)
          .setColor(0xe67e22),
      ],
    });
    return;
  }

  // ── Register challenge ─────────────────────────────────────────────────────
  const channelRef = message.channel;

  createChallenge({
    challengerId: message.author.id,
    challengerUsername: message.author.username,
    targetId: target.id,
    channelId: battleChannelId,
    guildId: message.guild!.id,
    expiresAt: now + CHALLENGE_TTL_MS,
  });

  // Auto-expire if not accepted
  setTimeout(() => {
    const existing = getChallenge(target.id);
    if (existing && existing.challengerId === message.author.id) {
      removeChallenge(target.id);
      if ("send" in channelRef) {
        channelRef
          .send({
            embeds: [
              new EmbedBuilder()
                .setTitle("⚔️  Challenge Expired")
                .setDescription(`**${target.username}** did not respond in time. The challenge has been withdrawn.`)
                .setColor(0x95a5a6),
            ],
          })
          .catch(() => null);
      }
    }
  }, CHALLENGE_TTL_MS);

  await message.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("⚔️  Battle Challenge Issued!")
        .setDescription(
          `**${message.author.username}** has challenged **${target.username}** to battle!\n\n` +
          `${target}, do you accept?\n` +
          `Type \`!accept\` to enter the arena or \`!decline\` to walk away.\n\n` +
          `*Challenge expires in 90 seconds.*`
        )
        .setColor(0xe67e22)
        .addFields(
          { name: "⚔️ Challenger", value: message.author.username, inline: true },
          { name: "🎯 Challenged", value: target.username, inline: true },
        )
        .setFooter({ text: "Battle events are private — only you see your moves via DM. Results posted here." })
        .setTimestamp(),
    ],
  });
}
