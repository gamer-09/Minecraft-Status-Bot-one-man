import { Message, EmbedBuilder, PermissionOverwriteOptions, TextChannel } from "discord.js";
import { getUser, saveUser, addEffect, getVipChannelId } from "../store.js";
import { findItemByName, SHOP_ITEMS } from "../shop-items.js";
import { applyNametag } from "../nametags.js";

export const name = "buy";
export const description = 'Buy an item from the shop — !buy <item name>';

export async function execute(message: Message) {
  const query = message.content.slice("!buy".length).trim().replace(/^"|"$/g, "").trim();

  if (!query) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("🏪  Buy — Usage")
          .setDescription("Provide the item name.\nExample: `!buy burns bright` or `!buy Coin Boost`")
          .setColor(0xe74c3c),
      ],
    });
    return;
  }

  const item =
    findItemByName(query) ??
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

  // Already owned check (non-consumables)
  if (
    (item.type === "nametag" || item.type === "power") &&
    user.inventory.includes(item.id)
  ) {
    const hint =
      item.type === "nametag"
        ? `Use \`!usetag ${item.name}\` to apply it.`
        : "Your power tag role is already active in the server.";
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("✅  Already Owned")
          .setDescription(`You already own **${item.emoji} ${item.name}**!\n${hint}`)
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
            `**${item.emoji} ${item.name}** costs **${item.price.toLocaleString()} coins**.\n` +
            `You have **${user.balance.toLocaleString()}** — you need **${needed.toLocaleString()} more**.\n\n` +
            `Win battles with \`!battle @user\` to earn more!`
          )
          .setColor(0xe74c3c),
      ],
    });
    return;
  }

  // Deduct coins & add to inventory
  user.balance -= item.price;
  if (item.type === "nametag" || item.type === "power") {
    if (!user.inventory.includes(item.id)) user.inventory.push(item.id);
  }
  saveUser(message.author.id, user);

  let extraNote = "";

  // ── Nametag ──────────────────────────────────────────────────────────────────
  if (item.type === "nametag" && item.tagValue && message.member) {
    const applied = await applyNametag(message.member, item.tagValue);
    extraNote = applied
      ? `\nYour nickname is now \`${message.member.displayName.split(" [")[0]} [${item.tagValue}]\`.`
      : "\n⚠️ Nickname could not be updated — the bot needs **Manage Nicknames** and must be above you in roles.";
  }

  // ── Power Tag ─────────────────────────────────────────────────────────────────
  if (item.type === "power" && message.guild && message.member) {
    try {
      const roleName = `power: ${item.name}`;

      // Find or create the role
      let role = message.guild.roles.cache.find((r) => r.name === roleName);
      if (!role) {
        role = await message.guild.roles.create({
          name: roleName,
          color: item.roleColor ?? 0x99aab5,
          hoist: item.hoisted ?? false,
          reason: `Power tag "${item.name}" purchased from bot shop`,
        });
      }

      // Remove any other power tag roles first (one active at a time)
      const powerRoles = message.guild.roles.cache.filter((r) =>
        r.name.startsWith("power: ")
      );
      for (const [, pr] of powerRoles) {
        if (pr.id !== role.id && message.member.roles.cache.has(pr.id)) {
          await message.member.roles.remove(pr).catch(() => null);
        }
      }

      await message.member.roles.add(role);
      user.powerTag = item.name;
      saveUser(message.author.id, user);

      extraNote = `\n${item.emoji} Your username colour in this server has changed!`;

      // ── VIP channel access ───────────────────────────────────────────────────
      if (item.vipAccess) {
        const vipChannelId = getVipChannelId();
        if (vipChannelId) {
          const vipChannel = message.guild.channels.cache.get(vipChannelId) as TextChannel | undefined;
          if (vipChannel && "permissionOverwrites" in vipChannel) {
            await (vipChannel as TextChannel).permissionOverwrites.edit(role, {
              ViewChannel: true,
              SendMessages: true,
              ReadMessageHistory: true,
            } as PermissionOverwriteOptions);
            extraNote += `\n🔑 You now have access to <#${vipChannelId}>!`;
          }
        } else {
          extraNote += "\n🔑 VIP channel not configured yet — ask an admin to run `!setvip #channel`.";
        }
      }

      if (item.hoisted) {
        extraNote += "\n⬆️ You now appear at the top of the member list!";
      }
    } catch {
      extraNote =
        "\n⚠️ Could not apply power tag role — make sure the bot has **Manage Roles** permission and its role is above others.";
    }
  }

  // ── Boost ─────────────────────────────────────────────────────────────────────
  if (item.type === "boost") {
    addEffect(message.author.id, { type: "coinboost" });
    extraNote = "\n⚡ **Coin Boost** is ready — doubles your next battle win!";
  }

  // ── Shield ────────────────────────────────────────────────────────────────────
  if (item.type === "shield") {
    addEffect(message.author.id, { type: "shield" });
    extraNote = "\n🛡️ **Battle Shield** is active — blocks your next battle loss!";
  }

  // ── VIP Pass (timed role) ─────────────────────────────────────────────────────
  if (item.type === "vip" && item.duration && message.guild && message.member) {
    try {
      let role = message.guild.roles.cache.find((r) => r.name === "VIP");
      if (!role) {
        role = await message.guild.roles.create({
          name: "VIP",
          color: 0xf1c40f,
          reason: "VIP Pass purchased from bot shop",
        });
      }
      await message.member.roles.add(role);
      const expiresAt = Date.now() + item.duration * 60 * 60 * 1000;
      addEffect(message.author.id, { type: "vip", expiresAt });
      setTimeout(async () => {
        try { await message.member!.roles.remove(role!); } catch { /* left server */ }
      }, item.duration * 60 * 60 * 1000);
      extraNote = `\n🌟 **VIP** role added for **${item.duration} hours**!`;
    } catch {
      extraNote =
        "\n⚠️ Could not assign VIP role — the bot needs **Manage Roles** and must be above VIP in the role list.";
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
