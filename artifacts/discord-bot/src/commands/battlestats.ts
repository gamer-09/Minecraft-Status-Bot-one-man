import { Message, EmbedBuilder } from "discord.js";
  import { getUser } from "../store.js";

  export const name = "battlestats";
  export const description = "View battle record and stats — !battlestats [@user]";

  export async function execute(message: Message) {
    const target = message.mentions.users.first() ?? message.author;
    const user = getUser(target.id);
    const s = user.battleStats;
    const isSelf = target.id === message.author.id;

    if (!s || (s.wins === 0 && s.losses === 0 && s.draws === 0)) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`⚔️  ${isSelf ? "Your" : `${target.username}'s`} Battle Record`)
            .setDescription(
              isSelf
                ? "You haven't fought any battles yet. Use `!battle @user` in the battle arena to get started!"
                : `**${target.username}** hasn't fought any battles yet.`
            )
            .setColor(0x95a5a6),
        ],
      });
      return;
    }

    const total = s.wins + s.losses + s.draws;
    const winRate = total > 0 ? ((s.wins / total) * 100).toFixed(1) : "0.0";
    const wlRatio = s.losses > 0 ? (s.wins / s.losses).toFixed(2) : s.wins > 0 ? "∞" : "0.00";

    const streakEmoji = s.streak >= 5 ? "🔥" : s.streak >= 3 ? "⚡" : "⚔️";

    const embed = new EmbedBuilder()
      .setTitle(`⚔️  ${isSelf ? "Your" : `${target.username}'s`} Battle Record`)
      .setColor(s.wins > s.losses ? 0x2ecc71 : s.wins < s.losses ? 0xe74c3c : 0xe67e22)
      .addFields(
        { name: "🏆 Wins",    value: `**${s.wins}**`,   inline: true },
        { name: "💔 Losses",  value: `**${s.losses}**`, inline: true },
        { name: "🤝 Draws",   value: `**${s.draws}**`,  inline: true },
        { name: "📊 Win Rate",  value: `**${winRate}%**`,    inline: true },
        { name: "⚖️ W/L Ratio", value: `**${wlRatio}**`,    inline: true },
        { name: "🎮 Total Fights", value: `**${total}**`,   inline: true },
        { name: "💰 Coins Earned", value: `**${s.coinsEarned.toLocaleString()}** 🪙`, inline: true },
        { name: "💎 Biggest Win",  value: `**${s.biggestWin.toLocaleString()}** 🪙`,  inline: true },
        { name: `${streakEmoji} Current Streak`, value: `**${s.streak}** wins`, inline: true },
        { name: "🌟 Best Streak", value: `**${s.bestStreak}** wins`, inline: true },
      )
      .setFooter({ text: "!battle @user to fight • !leaderboard for rankings" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  }
  