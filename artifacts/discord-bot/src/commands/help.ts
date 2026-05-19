import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("List all available bot commands");

export async function execute(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setTitle("📖 Bot Commands")
    .setDescription("Here are all the commands you can use:")
    .setColor(0x5865f2)
    .addFields(
      { name: "/status", value: "Check if the server is online, see players and info", inline: false },
      { name: "/ip", value: "Get the server IP and instructions to join", inline: false },
      { name: "/players", value: "See who is currently online", inline: false },
      { name: "/ping", value: "Check the server response time", inline: false },
      { name: "/help", value: "Show this help message", inline: false }
    )
    .setFooter({ text: "Status updates are posted automatically every 30 seconds" })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
