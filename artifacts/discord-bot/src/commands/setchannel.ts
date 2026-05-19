import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  TextChannel,
} from "discord.js";
import { setStatusChannelId } from "../store.js";

export const data = new SlashCommandBuilder()
  .setName("setchannel")
  .setDescription("Set the channel where live server status and events are posted")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("The channel to use (defaults to the current channel)")
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const target =
    (interaction.options.getChannel("channel") as TextChannel | null) ??
    interaction.channel;

  if (!target || !("send" in target)) {
    await interaction.reply({
      content: "Could not resolve a valid text channel.",
      ephemeral: true,
    });
    return;
  }

  setStatusChannelId(target.id);

  const embed = new EmbedBuilder()
    .setTitle("✅ Status Channel Set")
    .setDescription(`All live server updates will now be posted in <#${target.id}>.`)
    .setColor(0x57f287)
    .addFields(
      { name: "What gets posted there", value: "• 30-second status embed\n• Player join/leave alerts\n• Server online/offline alerts" }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
