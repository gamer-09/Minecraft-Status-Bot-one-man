import { Message, EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { addCoins } from "../store.js";
import { checkLeaderboardUpdate } from "../leaderboardWatcher.js";

export const name = "give";
export const description = "Give (or take) coins from a user — !give @user <amount> (Admin only)";

export async function execute(message: Message) {
    if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("🚫  Access Denied")
            .setDescription("You need **Administrator** permission to use this command.")
            .setColor(0xe74c3c),
        ],
      });
      return;
    }

    const target = message.mentions.users.first();
    if (!target) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❓  Usage")
            .setDescription(
              "Mention a user and provide an amount.\n\n" +
              "Examples:\n" +
              "`!give @user 500` — give 500 coins\n" +
              "`!give @user -200` — remove 200 coins"
            )
            .setColor(0xe67e22),
        ],
      });
      return;
    }

    if (target.bot) {
      await message.reply({ embeds: [new EmbedBuilder().setDescription("Cannot give coins to bots.").setColor(0xe74c3c)] });
      return;
    }

    const args = message.content.trim().split(/\s+/);
    // Find the amount argument — the last token that looks like a number
    const amountArg = args.slice(2).find((a) => /^-?\d+$/.test(a));
    const amount = amountArg ? parseInt(amountArg, 10) : NaN;

    if (isNaN(amount) || amount === 0) {
      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("❓  Invalid Amount")
            .setDescription(
              "Provide a non-zero number.\n" +
              "Example: `!give @user 500` or `!give @user -200`"
            )
            .setColor(0xe67e22),
        ],
      });
      return;
    }

    const newBalance = addCoins(target.id, amount);
    checkLeaderboardUpdate(message.client).catch(() => null);
    const action = amount > 0 ? "given" : "removed";
    const abs = Math.abs(amount);
    const color = amount > 0 ? 0x2ecc71 : 0xe74c3c;

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`💰  Coins ${amount > 0 ? "Granted" : "Removed"}`)
          .setDescription(
            `**${abs.toLocaleString()} coins** ${action} ${amount > 0 ? "to" : "from"} **${target.username}**.`
          )
          .addFields(
            { name: "New Balance", value: `${newBalance.toLocaleString()} 🪙`, inline: true },
            { name: "Action by", value: message.author.username, inline: true },
          )
          .setColor(color)
          .setTimestamp(),
      ],
    });
  }
  