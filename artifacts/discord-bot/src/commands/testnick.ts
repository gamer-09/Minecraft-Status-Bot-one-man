import { Message, EmbedBuilder, PermissionFlagsBits } from "discord.js";

export const name = "testnick";
export const description = "Test if the bot can set a nickname on a mentioned user (Admin only)";

export async function execute(message: Message) {
  if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
    await message.reply("You need **Administrator** permission to use this command.");
    return;
  }

  const guild = message.guild;
  if (!guild) return;

  const target = message.mentions.members?.first();
  if (!target) {
    await message.reply("Mention a user to test. Example: `!testnick @Steam33`");
    return;
  }

  if (target.user.bot) {
    await message.reply("Cannot test on bots.");
    return;
  }

  const testNick = "test-nick-" + Date.now().toString().slice(-4);

  try {
    await target.setNickname(testNick, "Bot nickname test");
    // Restore original nickname
    await target.setNickname(target.nickname, "Restore after test");
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("✅  Nickname Test Passed")
          .setDescription(`Successfully set and restored **${target.user.username}**'s nickname.\nThe bot **can** rename this member — nickname system is working.`)
          .setColor(0x2ecc71),
      ],
    });
  } catch (err: unknown) {
    const { DiscordAPIError } = await import("discord.js");
    let reason = "Unknown error";
    if (err instanceof DiscordAPIError) {
      reason = `Discord error **${err.code}**: ${err.message}`;
      if (Number(err.code) === 50013) {
        reason +=
          "\n\n**Fix:** Go to **Server Settings → Roles**, find the bot's role, and drag it **above** " +
          `**${target.user.username}**'s highest role, then try again.`;
      }
    } else if (err instanceof Error) {
      reason = err.message;
    }

    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌  Nickname Test Failed")
          .setDescription(`Could not set nickname for **${target.user.username}**.\n\n${reason}`)
          .setColor(0xe74c3c),
      ],
    });
  }
}
