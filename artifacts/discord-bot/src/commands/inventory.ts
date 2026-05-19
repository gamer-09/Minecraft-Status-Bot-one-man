import { Message, EmbedBuilder } from "discord.js";
import { getUser } from "../store.js";
import { getItem } from "../shop-items.js";

export const name = "inventory";
export const description = "View your owned items — !inventory";

export async function execute(message: Message) {
  const user = getUser(message.author.id);
  const now = Date.now();

  const ownedItems =
    user.inventory.length > 0
      ? user.inventory
          .map((id) => {
            const item = getItem(id);
            if (!item) return null;
            const active = item.type === "nametag" && user.nametag === item.tagValue
              ? " *(active)*" : "";
            return `${item.emoji} **${item.name}**${active} — *${item.description}*`;
          })
          .filter(Boolean)
          .join("\n")
      : "*No items yet. Visit the shop with* `!shop`*!*";

  const activeEffects = user.activeEffects.filter(
    (e) => e.expiresAt === undefined || e.expiresAt > now
  );
  const effectLines =
    activeEffects.length > 0
      ? activeEffects.map((e) => {
          const expiry = e.expiresAt
            ? `expires <t:${Math.floor(e.expiresAt / 1000)}:R>`
            : "one-time use — consumed on next battle";
          const emoji = e.type === "coinboost" ? "⚡" : e.type === "shield" ? "🛡️" : "🌟";
          return `${emoji} **${e.type}** — ${expiry}`;
        }).join("\n")
      : "*None*";

  const { OWNER_TAG, ADMIN_TAG } = await import("../authority.js");
  const isAuthority = user.nametag === OWNER_TAG || user.nametag === ADMIN_TAG;
  const powerTagLine = user.powerTag
    ? isAuthority
      ? `👑 \`[${user.powerTag}]\` — *authority-granted (not purchasable)*`
      : `⚡ \`[${user.powerTag}]\` — *active power tag role*`
    : "*None*";

  const embed = new EmbedBuilder()
    .setTitle(`🎒  ${message.author.username}'s Inventory`)
    .setColor(0x9b59b6)
    .addFields(
      { name: "💰 Coins", value: `${user.balance.toLocaleString()} 🪙`, inline: true },
      { name: "🏷️ Nametag", value: user.nametag ? `\`[${user.nametag}]\`` : "*None*", inline: true },
      { name: "⚡ Power Tag", value: powerTagLine, inline: true },
      { name: "🛍️ Owned Items", value: ownedItems },
      { name: "✨ Active Effects", value: effectLines }
    )
    .setFooter({ text: "!shop to browse • !buy to purchase • !usetag to switch nametags" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
