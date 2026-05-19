import { Message, EmbedBuilder } from "discord.js";
import { getShopChannelId, getUser } from "../store.js";
import { SHOP_ITEMS, ShopItem } from "../shop-items.js";

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

  function itemLine(item: ShopItem) {
    const owned = user.inventory.includes(item.id) ? " ✅" : "";
    const active =
      item.type === "power" && user.powerTag === item.name ? " *(active)*" : "";
    return `${item.emoji} **${item.name}**${owned}${active} — \`${item.price.toLocaleString()} coins\`\n*${item.description}*`;
  }

  const nametags = SHOP_ITEMS.filter((i) => i.type === "nametag");
  const powerTags = SHOP_ITEMS.filter((i) => i.type === "power");
  const battleItems = SHOP_ITEMS.filter((i) => i.type === "boost" || i.type === "shield");
  const privileges = SHOP_ITEMS.filter((i) => i.type === "vip");

  const embed = new EmbedBuilder()
    .setTitle("🏪  The Shop")
    .setDescription(
      `Your balance: **${user.balance.toLocaleString()} coins** 🪙\nUse \`!buy <item name>\` to purchase.\n\n✅ = owned  •  *(active)* = currently equipped`
    )
    .setColor(0x9b59b6)
    .addFields(
      {
        name: "🏷️  Nametags — Applied to your nickname",
        value: nametags.map(itemLine).join("\n\n"),
      },
      {
        name: "⚡  Power Tags — Real Discord effects",
        value:
          powerTags.map(itemLine).join("\n\n") +
          "\n\n*Only one power tag can be active at a time. Buying a new one replaces the old one.*",
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
    .setFooter({ text: "Power tags change your Discord username color and grant server effects • Nametags update your nickname" })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
