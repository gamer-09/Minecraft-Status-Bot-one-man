import { Message, EmbedBuilder } from "discord.js";
  import { getAllUsers } from "../store.js";

  export const name = "leaderboard";
  export const description = "Top 10 players ranked by coin balance — !leaderboard";

  const MEDALS = ["🥇", "🥈", "🥉"];

  export async function execute(message: Message) {
    const allUsers = getAllUsers();

    const ranked = Object.entries(allUsers)
      .map(([userId, data]) => ({ userId, balance: data.balance, nametag: data.nametag }))
      .filter(({ balance }) => balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 10);

    if (ranked.length === 0) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🏆  Leaderboard")
            .setDescription("No one has earned any coins yet. Start a `!battle` to get on the board!")
            .setColor(0xf1c40f)
            .setTimestamp(),
        ],
      });
      return;
    }

    // Fetch Discord usernames for all ranked players
    const rows: string[] = [];
    for (let i = 0; i < ranked.length; i++) {
      const { userId, balance, nametag } = ranked[i];
      let displayName = `<@${userId}>`;
      try {
        const user = await message.client.users.fetch(userId);
        displayName = user.username;
      } catch { /* use mention fallback */ }

      const medal = MEDALS[i] ?? `**#${i + 1}**`;
      const tag   = nametag ? ` [${nametag}]` : "";
      rows.push(`${medal} **${displayName}${tag}** — ${balance.toLocaleString()} 🪙`);
    }

    // Find the caller's rank
    const callerId = message.author.id;
    const callerRankIndex = Object.entries(allUsers)
      .filter(([, d]) => d.balance > 0)
      .sort(([, a], [, b]) => b.balance - a.balance)
      .findIndex(([id]) => id === callerId);

    const footerText =
      callerRankIndex >= 0
        ? `Your rank: #${callerRankIndex + 1} • Win battles to climb the board`
        : "Win battles to earn coins and get on the board";

    const embed = new EmbedBuilder()
      .setTitle("🏆  Coin Leaderboard")
      .setDescription(rows.join("\n"))
      .setColor(0xf1c40f)
      .setFooter({ text: footerText })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
  