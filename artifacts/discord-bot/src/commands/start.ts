import { Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { config } from "../config.js";

export const name = "start";
export const description = "Get the link and IP to start the Minecraft server via Falix";

export async function execute(message: Message) {
  const serverIp = config.host ?? "oneman.falixsrv.me";

  const embed = new EmbedBuilder()
    .setTitle("🚀  Start the Minecraft Server")
    .setDescription(
      "The server needs to be woken up on the Falix panel.\n\n" +
      "**Steps:**\n" +
      "1. Click the button below\n" +
      `2. Paste the server IP: \`${serverIp}\`\n` +
      "3. Hit **Start Server** and wait ~1 minute\n" +
      "4. The feed channel will announce when it's online ✅"
    )
    .setColor(0x2ecc71)
    .setTimestamp();

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("Open Falix Start Page")
      .setStyle(ButtonStyle.Link)
      .setURL("https://falixnodes.net/startserver")
      .setEmoji("🌐")
  );

  await message.reply({ embeds: [embed], components: [row] });
}
