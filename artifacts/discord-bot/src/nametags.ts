import { Collection, DiscordAPIError, Guild, GuildMember } from "discord.js";
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

export function formatNick(tag: string): string {
  return tag;
}

export interface ApplyResult {
  ok: boolean;
  error?: string;
}

export async function applyNametag(member: GuildMember, tag: string): Promise<ApplyResult> {
  try {
    await member.setNickname(formatNick(tag));
    const user = getUser(member.id);
    user.nametag = tag;
    saveUser(member.id, user);
    return { ok: true };
  } catch (err: unknown) {
    let error: string;
    if (err instanceof DiscordAPIError) {
      error = `Discord error ${err.code}: ${err.message}`;
    } else if (err instanceof Error) {
      error = err.message;
    } else {
      error = String(err);
    }
    console.warn(`[nametags] Could not set nickname for ${member.user.username}: ${error}`);
    return { ok: false, error };
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
  failed: { username: string; reason: string }[];
  totalFetched: number;
}

export async function scanAndAssignStarterTags(
  guild: Guild,
  members: Collection<string, GuildMember>,
): Promise<ScanResult> {
  const result: ScanResult = {
    assigned: [],
    reapplied: [],
    skipped: 0,
    failed: [],
    totalFetched: members.size,
  };

  for (const [, member] of members) {
    if (member.user.bot) continue;

    const user = getUser(member.id);

    if (user.nametag) {
      // Already has a tag in store — check if the actual Discord nickname matches
      const currentNick = member.nickname ?? "";
      if (currentNick === user.nametag) {
        result.skipped++;
        continue;
      }
      // Store tag exists but nickname doesn't match — re-apply
      const res = await applyNametag(member, user.nametag);
      if (res.ok) result.reapplied.push(member.user.username);
      else result.failed.push({ username: member.user.username, reason: res.error ?? "unknown" });
      continue;
    }

    // No tag yet — assign a fresh starter tag
    const tag = pickStarterTag();
    const res = await applyNametag(member, tag);
    if (res.ok) result.assigned.push(member.user.username);
    else result.failed.push({ username: member.user.username, reason: res.error ?? "unknown" });
  }

  console.log(
    `[nametags] Scan complete in "${guild.name}": ` +
    `fetched ${result.totalFetched}, ${result.assigned.length} new, ` +
    `${result.reapplied.length} reapplied, ${result.skipped} already tagged, ` +
    `${result.failed.length} failed`
  );

  return result;
}
