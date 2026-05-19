import { Message, EmbedBuilder } from "discord.js";
import { getUser, saveUser, addEffect } from "../store.js";
import { findItemByName, SHOP_ITEMS } from "../shop-items.js";
import { applyNametag } from "../nametags.js";

export const name = "buy";
export const description = 'Buy an item from the shop — !buy "item name"';

export async function execute(message: Message) {
  const query = message.content.slice("!buy".length).trim().replace(/^"|"$/g, "").trim();

  if (!query) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🏪  Buy — Usage")
          .setDescription('Provide the item name.\nExample: `!buy "The Legend"` or `!buy coin boost`')
          .setColor(0xe74c3c),
      ],
    });
    return;
  }

  const item = findItemByName(query) ??
    SHOP_ITEMS.find((i) => i.name.toLowerCase().includes(query.toLowerCase()));

  if (!item) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌  Item Not Found")
          .setDescription(`Could not find an item matching \`${query}\`.\nCheck \`!shop\` for available items.`)
          .setColor(0xe74c3c),
      ],
    });
    return;
  }

  const user = getUser(message.author.id);

  // Check if already owned (non-consumables only)
  if (item.type === "nametag" && user.inventory.includes(item.id)) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🏷️  Already Owned")
          .setDescription(`You already own **${item.name}**!\nTo apply it, use \`!usetag ${item.name}\`.`)
          .setColor(0xe67e22),
      ],
    });
    return;
  }

  if (user.balance < item.price) {
    const needed = item.price - user.balance;
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("💸  Not Enough Coins")
          .setDescription(
            `**${item.name}** costs **${item.price.toLocaleString()} coins**.\n` +
            `You have **${user.balance.toLocaleString()} coins** — you need **${needed.toLocaleString()} more**.\n\n` +
            `Win battles with \`!battle @user\` to earn more!`
          )
          .setColor(0xe74c3c),
      ],
    });
    return;
  }

  // Deduct coins
  user.balance -= item.price;
  if (item.type === "nametag") {
    if (!user.inventory.includes(item.id)) user.inventory.push(item.id);
  }
  saveUser(message.author.id, user);

  // Apply effects
  let extraNote = "";

  if (item.type === "nametag" && item.tagValue) {
    const member = message.member;
    if (member) {
      const applied = await applyNametag(member, item.tagValue);
      extraNote = applied
        ? `\nYour nickname has been updated to \`${message.author.username} [${item.tagValue}]\`.`
        : "\nCould not update your nickname automatically — please ask an admin to do it manually.";
    }
  }

  if (item.type === "boost") {
    addEffect(message.author.id, { type: "coinboost" });
    extraNote = "\n⚡ Your **Coin Boost** is ready — it will double your next battle win!";
  }

  if (item.type === "shield") {
    addEffect(message.author.id, { type: "shield" });
    extraNote = "\n🛡️ Your **Battle Shield** is active — it will block your next battle loss!";
  }

  if (item.type === "vip" && item.duration) {
    const guild = message.guild;
    if (guild) {
      try {
        let role = guild.roles.cache.find((r) => r.name === "VIP");
        if (!role) {
          role = await guild.roles.create({ name: "VIP", color: 0xf1c40f, reason: "VIP Pass purchased from bot shop" });
        }
        const member = message.member;
        if (member) {
          await member.roles.add(role);
          const expiresAt = Date.now() + item.duration * 60 * 60 * 1000;
          addEffect(message.author.id, { type: "vip", expiresAt });

          // Schedule role removal
          setTimeout(async () => {
            try {
              await member.roles.remove(role!);
            } catch { /* member may have left */ }
          }, item.duration * 60 * 60 * 1000);

          extraNote = `\n🌟 The **VIP** role has been added to your profile for **${item.duration} hours**!`;
        }
      } catch {
        extraNote = "\n⚠️ Could not assign the VIP role — make sure the bot has **Manage Roles** permission and is above the VIP role.";
      }
    }
  }

  const embed = new EmbedBuilder()
    .setTitle("✅  Purchase Successful!")
    .setDescription(
      `You bought **${item.emoji} ${item.name}** for **${item.price.toLocaleString()} coins**!${extraNote}`
    )
    .setColor(0x2ecc71)
    .addFields({ name: "💰 Remaining Balance", value: `${user.balance.toLocaleString()} coins`, inline: true })
    .setTimestamp();

  await message.reply({ embeds: [embed] });
}
