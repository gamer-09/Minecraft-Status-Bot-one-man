import { Client, EmbedBuilder, TextChannel } from "discord.js";
import { getAllUsers, getLeaderboardChannelId } from "./store.js";

// ─── Snapshot ─────────────────────────────────────────────────────────────────
// Each entry: userId + balance so we detect rank changes AND score changes
interface SnapEntry { userId: string; balance: number; }
let lastSnapshot: SnapEntry[] = [];

function snapshotChanged(newSnap: SnapEntry[]): boolean {
  if (newSnap.length !== lastSnapshot.length) return true;
  return newSnap.some((e, i) => e.userId !== lastSnapshot[i].userId || e.balance !== lastSnapshot[i].balance);
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function checkLeaderboardUpdate(client: Client): Promise<void> {
  const channelId = getLeaderboardChannelId();
  if (!channelId) return;

  const allUsers = getAllUsers();
  const sorted = Object.entries(allUsers)
    .filter(([, d]) => d.balance > 0)
    .sort(([, a], [, b]) => b.balance - a.balance)
    .slice(0, 10);

  const newSnap: SnapEntry[] = sorted.map(([userId, d]) => ({ userId, balance: d.balance }));

  if (!snapshotChanged(newSnap)) return;
  lastSnapshot = newSnap;

  // Fetch the announcement channel
  let channel: TextChannel | null = null;
  try {
    const ch = await client.channels.fetch(channelId);
    if (ch && ch.isTextBased() && !ch.isDMBased()) channel = ch as TextChannel;
  } catch { return; }
  if (!channel) return;

  // Build rows
  const MEDALS = ["🥇", "🥈", "🥉"];
  const rows: string[] = [];
  for (let i = 0; i < newSnap.length; i++) {
    const { userId, balance } = newSnap[i];
    const userData = allUsers[userId];
    let name = `<@${userId}>`;
    try {
      const user = await client.users.fetch(userId);
      name = user.username;
    } catch { /* fallback to mention */ }
    const tag    = userData?.nametag ? ` [${userData.nametag}]` : "";
    const medal  = MEDALS[i] ?? `**#${i + 1}**`;
    rows.push(`${medal} **${name}${tag}** — ${balance.toLocaleString()} 🪙`);
  }

  const embed = new EmbedBuilder()
    .setTitle("🏆  Leaderboard Updated")
    .setDescription(rows.join("\n"))
    .setColor(0xf1c40f)
    .setFooter({ text: "Rankings change after battles, daily rewards, and admin adjustments" })
    .setTimestamp();

  await channel.send({ embeds: [embed] }).catch(() => null);
}
