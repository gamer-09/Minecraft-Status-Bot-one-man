import { Message } from "discord.js";
import { buildJoinEmbed } from "../embeds.js";

export const name = "ip";
export const description = "Get the Minecraft server IP and instructions to join";

export async function execute(message: Message) {
  const embed = buildJoinEmbed();
  await message.reply({ embeds: [embed] });
}
