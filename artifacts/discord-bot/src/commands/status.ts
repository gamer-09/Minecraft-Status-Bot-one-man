import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { getServerStatus } from "../minecraft.js";
import { buildStatusEmbed } from "../embeds.js";

export const data = new SlashCommandBuilder()
  .setName("status")
  .setDescription("Check the current Minecraft server status");

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
  const serverStatus = await getServerStatus();
  const embed = buildStatusEmbed(serverStatus);
  await interaction.editReply({ embeds: [embed] });
}
