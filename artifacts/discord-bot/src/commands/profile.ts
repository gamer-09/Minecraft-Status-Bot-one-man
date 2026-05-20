import { Message, EmbedBuilder } from "discord.js";
  import { getUser } from "../store.js";

  export const name = "profile";
  export const description = "View a full player profile — !profile [@user]";

  export async function execute(message: Message) {
    const target = message.mentions.users.first() ?? message.author;
    const user = getUser(target.id);
    const isSelf = target.id === message.author.id;
    const now = Date.now();
    const s = user.battleStats;

    // ── Nametag ──────────────────────────────────────────────────────────────────
    const { OWNER_TAG, ADMIN_TAG } = await import("../authority.js");
    const isAuthority = user.nametag === OWNER_TAG || user.nametag === ADMIN_TAG;
    const tagLine = user.nametag ? `\`[${user.nametag}]\`${isAuthority ? " 👑" : ""}` : "*None equipped*";

    // ── Active effects ────────────────────────────────────────────────────────────
    const activeEffects = user.activeEffects.filter(
      (e) => e.expiresAt === undefined || e.expiresAt > now
    );
    const effectLine =
      activeEffects.length > 0
        ? activeEffects.map((e) => {
            const expiry = e.expiresAt ? `expires <t:${Math.floor(e.expiresAt / 1000)}:R>` : "one-time use";
            const emoji = e.type === "coinboost" ? "⚡" : e.type === "shield" ? "🛡️" : "🌟";
            return `${emoji} **${e.type}** — ${expiry}`;
          }).join("\n")
        : "*None*";

    // ── Battle stats ──────────────────────────────────────────────────────────────
    let battleLine: string;
    if (!s || (s.wins === 0 && s.losses === 0 && s.draws === 0)) {
      battleLine = "*No battles fought yet.*";
    } else {
      const total = s.wins + s.losses + s.draws;
      const winRate = total > 0 ? ((s.wins / total) * 100).toFixed(1) : "0.0";
      const streakEmoji = s.streak >= 5 ? "🔥" : s.streak >= 3 ? "⚡" : "⚔️";
      battleLine = [
        `**${s.wins}W / ${s.losses}L / ${s.draws}D** (${winRate}% win rate)`,
        `💰 Coins earned: **${s.coinsEarned.toLocaleString()}** | 💎 Biggest win: **${s.biggestWin.toLocaleString()}**`,
        `${streakEmoji} Current streak: **${s.streak}** | 🌟 Best streak: **${s.bestStreak}**`,
      ].join("\n");
    }

    // ── Daily countdown ────────────────────────────────────────────────────────────
    const dailyReady = !user.lastDaily || (now - user.lastDaily) >= 24 * 60 * 60 * 1000;
    const dailyLine = dailyReady
      ? "✅ **Ready to claim!**  Use `!daily`"
      : `⏳ Next reward <t:${Math.floor((user.lastDaily! + 24 * 60 * 60 * 1000) / 1000)}:R>`;

    const embed = new EmbedBuilder()
      .setTitle(`🧑‍⚔️  ${isSelf ? "Your" : `${target.username}'s`} Profile`)
      .setColor(0x5865f2)
      .addFields(
        { name: "💰 Balance",       value: `**${user.balance.toLocaleString()}** 🪙`, inline: true },
        { name: "🏷️ Nametag",       value: tagLine,                                      inline: true },
        { name: "🎁 Daily Reward",   value: dailyLine },
        { name: "⚔️ Battle Record",  value: battleLine },
        { name: "✨ Active Effects", value: effectLine },
      )
      .setThumbnail(target.displayAvatarURL())
      .setFooter({ text: "!battlestats for detailed combat stats • !daily to claim your reward" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
  