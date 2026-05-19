import {
  Message,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";

export const name = "poll";
export const description = 'Create a poll — !poll "Question" "Option 1" "Option 2" ...';

// In-memory store: messageId -> { votes: Map<userId, optionIndex>, options: string[], question: string }
interface PollData {
  question: string;
  options: string[];
  votes: Map<string, number>;
}

export const activePolls = new Map<string, PollData>();

function parseQuoted(input: string): string[] {
  const results: string[] = [];
  const regex = /"([^"]+)"/g;
  let match;
  while ((match = regex.exec(input)) !== null) {
    results.push(match[1]);
  }
  return results;
}

function buildPollEmbed(poll: PollData): EmbedBuilder {
  const totalVotes = poll.votes.size;

  const optionLines = poll.options.map((opt, i) => {
    const count = [...poll.votes.values()].filter((v) => v === i).length;
    const pct = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
    const bar = "█".repeat(Math.floor(pct / 10)) + "░".repeat(10 - Math.floor(pct / 10));
    return `**${i + 1}.** ${opt}\n\`${bar}\` ${count} vote${count !== 1 ? "s" : ""} (${pct}%)`;
  });

  return new EmbedBuilder()
    .setTitle("📊  Poll")
    .setDescription(`**${poll.question}**\n\n${optionLines.join("\n\n")}`)
    .setColor(0x5865f2)
    .setFooter({ text: `${totalVotes} vote${totalVotes !== 1 ? "s" : ""} cast • Click a button to vote — you can only pick one` })
    .setTimestamp();
}

const BUTTON_STYLES = [
  ButtonStyle.Primary,
  ButtonStyle.Success,
  ButtonStyle.Danger,
  ButtonStyle.Secondary,
];

export async function execute(message: Message) {
  const parts = parseQuoted(message.content);

  if (parts.length < 3) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("📊  Poll — Usage")
          .setDescription(
            "**Format:** `!poll \"Question\" \"Option 1\" \"Option 2\" ...`\n\n" +
            "**Example:**\n`!poll \"Best Minecraft biome?\" \"Forest\" \"Desert\" \"Ocean\" \"Mountains\"`\n\n" +
            "• Minimum **2 options**, maximum **5 options**\n" +
            "• Wrap everything in **quotes**"
          )
          .setColor(0xe74c3c),
      ],
    });
    return;
  }

  const [question, ...options] = parts;

  if (options.length > 5) {
    await message.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("❌  Too many options")
          .setDescription("Polls support a maximum of **5 options**.")
          .setColor(0xe74c3c),
      ],
    });
    return;
  }

  const poll: PollData = { question, options, votes: new Map() };

  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  const chunkSize = 5;
  for (let i = 0; i < options.length; i += chunkSize) {
    const row = new ActionRowBuilder<ButtonBuilder>();
    options.slice(i, i + chunkSize).forEach((opt, j) => {
      const idx = i + j;
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`poll_${idx}`)
          .setLabel(`${idx + 1}. ${opt}`)
          .setStyle(BUTTON_STYLES[idx % BUTTON_STYLES.length])
      );
    });
    rows.push(row);
  }

  const pollMessage = await message.reply({
    embeds: [buildPollEmbed(poll)],
    components: rows,
  });

  activePolls.set(pollMessage.id, poll);

  // Collector handles votes on this message
  const collector = pollMessage.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 24 * 60 * 60 * 1000, // 24 hours
  });

  collector.on("collect", async (interaction) => {
    if (!interaction.customId.startsWith("poll_")) return;
    const optionIndex = parseInt(interaction.customId.replace("poll_", ""));

    const prev = poll.votes.get(interaction.user.id);
    poll.votes.set(interaction.user.id, optionIndex);

    const isChange = prev !== undefined && prev !== optionIndex;
    const responseText = isChange
      ? `✅ Changed your vote to **${options[optionIndex]}**.`
      : prev === optionIndex
      ? `You already voted for **${options[optionIndex]}**.`
      : `✅ Voted for **${options[optionIndex]}**!`;

    await interaction.update({ embeds: [buildPollEmbed(poll)], components: rows });
    await interaction.followUp({ content: responseText, ephemeral: true });
  });

  collector.on("end", async () => {
    activePolls.delete(pollMessage.id);
    const finalEmbed = buildPollEmbed(poll)
      .setTitle("📊  Poll — Closed")
      .setColor(0x95a5a6)
      .setFooter({ text: `${poll.votes.size} total vote${poll.votes.size !== 1 ? "s" : ""} • Poll ended` });

    const disabledRows = rows.map((row) => {
      const newRow = new ActionRowBuilder<ButtonBuilder>();
      row.components.forEach((btn) => {
        newRow.addComponents(ButtonBuilder.from(btn).setDisabled(true));
      });
      return newRow;
    });

    await pollMessage.edit({ embeds: [finalEmbed], components: disabledRows }).catch(() => null);
  });
}
