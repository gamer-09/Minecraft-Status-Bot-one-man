import { Message, EmbedBuilder } from "discord.js";
import { getUser } from "../store.js";
import { SHOP_ITEMS } from "../shop-items.js";
import { applyNametag } from "../nametags.js";

export const name = "usetag";
export const description = 'Switch to an owned nametag — !usetag "tag name"';

export async function execute(message: Message) {
  const query = message.content.slice("!usetag".length).trim().replace(/^"|"$/g, "").trim();

  if (!query) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🏷️  Use Tag — Usage")
          .setDescription('Provide the tag name.\nExample: `!usetag The Legend`')
          .setColor(0xe74c3c),
      ],
    });
    return;
  }

  const user = getUser(message.author.id);

  const item = SHOP_ITEMS.filter((i) => i.type === "nametag").find(
    (i) =>
      i.tagValue?.toLowerCase() === query.toLowerCase() ||
      i.name.toLowerCase() === query.toLowerCase()
  );

  if (!item || !item.tagValue) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌  Tag Not Found")
          .setDescription(`No nametag matches \`${query}\`.\nCheck your owned tags with \`!inventory\`.`)
          .setColor(0xe74c3c),
      ],
    });
    return;
  }

  if (!user.inventory.includes(item.id)) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🔒  Not Owned")
          .setDescription(`You don't own **${item.name}** yet!\nBuy it from \`!shop\` for **${item.price.toLocaleString()} coins**.`)
          .setColor(0xe74c3c),
      ],
    });
    return;
  }

  const member = message.member;
  if (!member) {
    await message.reply("Could not find your server profile.");
    return;
  }

  const applied = await applyNametag(member, item.tagValue);

  if (applied) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🏷️  Tag Applied!")
          .setDescription(`Your tag is now **[${item.tagValue}]**.\nYour nickname has been updated!`)
          .setColor(0x2ecc71)
          .setTimestamp(),
      ],
    });
  } else {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("⚠️  Could Not Apply Tag")
          .setDescription("The bot couldn't update your nickname — it may lack **Manage Nicknames** permission or your role is higher than the bot's.")
          .setColor(0xe67e22),
      ],
    });
  }
}
