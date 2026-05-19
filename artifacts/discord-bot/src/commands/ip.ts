import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { buildJoinEmbed } from "../embeds.js";

export const data = new SlashCommandBuilder()
  .setName("ip")
  .setDescription("Get the Minecraft server IP and instructions to join");

export async function execute(interaction: ChatInputCommandInteraction) {
  const embed = buildJoinEmbed();
  await interaction.reply({ embeds: [embed] });
}
