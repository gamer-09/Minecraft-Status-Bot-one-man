import { Message } from "discord.js";
import { getServerStatus } from "../minecraft.js";
import { buildStatusEmbed } from "../embeds.js";

export const name = "status";
export const description = "Check the current Minecraft server status";

export async function execute(message: Message) {
  const msg = await message.reply("Checking server...");
  const serverStatus = await getServerStatus();
  const embed = buildStatusEmbed(serverStatus);
  await msg.edit({ content: "", embeds: [embed] });
}
