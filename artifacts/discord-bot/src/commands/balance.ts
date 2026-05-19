import { Message, EmbedBuilder } from "discord.js";
import { getUser } from "../store.js";

export const name = "balance";
export const description = "Check your coin balance — !balance [@user]";

export async function execute(message: Message) {
  const target = message.mentions.users.first() ?? message.author;
  const user = getUser(target.id);
  const now = Date.now();

  const activeEffects = user.activeEffects.filter(
    (e) => e.expiresAt === undefined || e.expiresAt > now
  );

  const effectLines =
    activeEffects.length > 0
      ? activeEffects.map((e) => {
          const expiry = e.expiresAt
            ? `expires <t:${Math.floor(e.expiresAt / 1000)}:R>`
            : "one-time use";
          const emoji =
            e.type === "coinboost" ? "⚡" : e.type === "shield" ? "🛡️" : "🌟";
          return `${emoji} **${e.type}** — ${expiry}`;
        }).join("\n")
      : "*No active effects*";

  const embed = new EmbedBuilder()
    .setTitle(`💰  ${target.id === message.author.id ? "Your" : `${target.username}'s`} Balance`)
    .setColor(0xf1c40f)
    .addFields(
      { name: "Coins", value: `**${user.balance.toLocaleString()}** 🪙`, inline: true },
      { name: "Tag", value: user.nametag ? `[${user.nametag}]` : "*None*", inline: true },
      { name: "Active Effects", value: effectLines }
    )
    .setFooter({ text: "Earn coins by winning !battle • Spend them with !shop" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
