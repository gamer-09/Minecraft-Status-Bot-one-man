import { Guild, GuildMember } from "discord.js";
import { getUser, saveUser } from "./store.js";

const STARTER_TAGS = [
  "yearns for the mines",
  "still finding coal",
  "lost in the nether",
  "fears the creepers",
  "sleeps through raids",
  "just passing through",
  "building in the dark",
  "digs in silence",
  "avoids the end",
  "hasn't touched grass",
  "spawned yesterday",
  "allergic to endermen",
];

export function pickStarterTag(): string {
  return STARTER_TAGS[Math.floor(Math.random() * STARTER_TAGS.length)];
}

// Nickname is set to the tag text directly — no brackets
export function formatNick(tag: string): string {
  return tag;
}

export async function applyNametag(member: GuildMember, tag: string): Promise<boolean> {
  try {
    await member.setNickname(formatNick(tag));
    // Only persist to store after the Discord nickname change succeeds
    const user = getUser(member.id);
    user.nametag = tag;
    saveUser(member.id, user);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[nametags] Could not set nickname for ${member.user.username}: ${msg}`);
    return false;
  }
}

export async function assignStarterTag(member: GuildMember): Promise<void> {
  if (member.user.bot) return;
  const user = getUser(member.id);
  if (user.nametag) return;
  const tag = pickStarterTag();
  await applyNametag(member, tag);
}

export interface ScanResult {
  assigned: string[];
  reapplied: string[];
  skipped: number;
  failed: string[];
}

export async function scanAndAssignStarterTags(guild: Guild): Promise<ScanResult> {
  const result: ScanResult = { assigned: [], reapplied: [], skipped: 0, failed: [] };

  try {
    const members = await guild.members.fetch();

    for (const [, member] of members) {
      if (member.user.bot) continue;

      const user = getUser(member.id);

      if (user.nametag) {
        // Check if their actual nickname already has the bracket tag
        const currentNick = member.nickname ?? "";
        const hasTag = currentNick.startsWith("[") && currentNick.endsWith("]");
        if (hasTag) {
          result.skipped++;
          continue;
        }
        // Store says tagged but nickname is bare — re-apply
        const ok = await applyNametag(member, user.nametag);
        if (ok) result.reapplied.push(member.user.username);
        else result.failed.push(member.user.username);
        continue;
      }

      // No tag yet — assign a fresh starter tag
      const tag = pickStarterTag();
      const ok = await applyNametag(member, tag);
      if (ok) result.assigned.push(member.user.username);
      else result.failed.push(member.user.username);
    }

    console.log(
      `[nametags] Scan complete in "${guild.name}": ` +
      `${result.assigned.length} new, ${result.reapplied.length} reapplied, ` +
      `${result.skipped} already tagged, ${result.failed.length} failed`
    );
  } catch (err) {
    console.error("[nametags] Starter tag scan failed:", err);
  }

  return result;
}
