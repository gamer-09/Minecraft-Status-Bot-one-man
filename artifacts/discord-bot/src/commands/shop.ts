import { Message, EmbedBuilder } from "discord.js";
import { getShopChannelId, getUser } from "../store.js";
import { SHOP_ITEMS } from "../shop-items.js";

export const name = "shop";
export const description = "Browse the item shop";

export async function execute(message: Message) {
  const shopChannelId = getShopChannelId();

  if (shopChannelId && message.channelId !== shopChannelId) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🏪  Wrong Channel")
          .setDescription(`The shop is only available in <#${shopChannelId}>!\nHead over there and try again.`)
          .setColor(0xe74c3c),
      ],
    });
    return;
  }

  if (!shopChannelId) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🏪  Shop Not Configured")
          .setDescription("An admin needs to set the shop channel first using `!setshop #channel`.")
          .setColor(0xe74c3c),
      ],
    });
    return;
  }

  const user = getUser(message.author.id);

  const nametags = SHOP_ITEMS.filter((i) => i.type === "nametag");
  const battleItems = SHOP_ITEMS.filter((i) => i.type === "boost" || i.type === "shield");
  const privileges = SHOP_ITEMS.filter((i) => i.type === "vip");

  function itemLine(item: typeof SHOP_ITEMS[0]) {
    const owned = user.inventory.includes(item.id) ? " ✅" : "";
    return `${item.emoji} **${item.name}**${owned} — \`${item.price.toLocaleString()} coins\`\n*${item.description}*`;
  }

  const embed = new EmbedBuilder()
    .setTitle("🏪  The Shop")
    .setDescription(
      `Your balance: **${user.balance.toLocaleString()} coins** 🪙\nUse \`!buy <item name>\` to purchase.\n\n` +
      `✅ = already owned`
    )
    .setColor(0x9b59b6)
    .addFields(
      {
        name: "🏷️  Nametags",
        value: nametags.map(itemLine).join("\n\n"),
      },
      {
        name: "⚔️  Battle Items",
        value: battleItems.map(itemLine).join("\n\n"),
      },
      {
        name: "🌟  Privileges",
        value: privileges.map(itemLine).join("\n\n"),
      }
    )
    .setFooter({ text: "Nametags are applied instantly • Battle items are used automatically • VIP grants a Discord role" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
