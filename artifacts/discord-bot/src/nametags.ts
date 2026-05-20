import { Collection, DiscordAPIError, Guild, GuildMember } from "discord.js";
import { getUser, getAllUsers, saveUser } from "./store.js";

export const STARTER_TAGS = [
  "dwells beneath the stone",
  "cursed by the endermen",
  "servant of the creeper lords",
  "seeker of forbidden ores",
  "wanderer of the old mines",
  "forsaken by the village elder",
  "lost in the deep dark",
  "once beheld the dragon",
  "keeper of the ancient ruins",
  "feared the elder guardian",
  "walks the nether wastes",
  "burned by the eternal lava",
  "whispered to the wolves",
  "shunned by the iron golem",
  "pilgrim of the end lands",
  "bearer of a broken compass",
  "scholar of redstone arts",
  "exile of the overworld",
  "child of the deep caves",
  "haunted by cave spiders",
  "forgotten by the stronghold",
  "cartographer of lost biomes",
  "acolyte of the nether fort",
  "marked by the wither's gaze",
  "summoned by the beacon",
  "relic seeker of the depths",
  "sworn foe of skeletons",
  "tamer of ancient wolves",
  "reads the sky for portents",
  "outlander of the mesa",
  "keeper of torch and flame",
  "bound to the old stronghold",
  "herald of the phantom tide",
  "gazer into the void",
  "touched by the sculk",
  "born under a blood moon",
];

/** Pick a tag not already used by anyone in the server.
 *  Falls back to a random tag if every tag is already taken. */
export function pickStarterTag(usedTags: Set<string> = new Set()): string {
  const available = STARTER_TAGS.filter((t) => !usedTags.has(t));
  const pool = available.length > 0 ? available : STARTER_TAGS;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Return the set of starter tags already assigned to anyone in the store. */
export function getUsedStarterTags(): Set<string> {
  const used = new Set<string>();
  const all = getAllUsers();
  for (const data of Object.values(all)) {
    if (data.nametag && STARTER_TAGS.includes(data.nametag)) {
      used.add(data.nametag);
    }
  }
  return used;
}

export function formatNick(baseName: string, tag: string): string {
  // Discord nickname limit is 32 chars. Format: "{base} [{tag}]"
  // base budget = 32 - " [" - tag - "]" = 29 - tag.length
  const maxBase = Math.max(1, 29 - tag.length);
  const trimmed = baseName.length > maxBase ? baseName.slice(0, maxBase).trimEnd() : baseName;
  return `${trimmed} [${tag}]`;
}

export interface ApplyResult {
  ok: boolean;
  error?: string;
}

export async function applyNametag(member: GuildMember, tag: string): Promise<ApplyResult> {
  try {
    const baseName = member.user.globalName ?? member.user.username;
    await member.setNickname(formatNick(baseName, tag));
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
  const used = getUsedStarterTags();
  const tag = pickStarterTag(used);
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

  // Seed used tags from store so this scan never re-uses an existing tag
  const usedTags = getUsedStarterTags();

  for (const [, member] of members) {
    if (member.user.bot) continue;

    const user = getUser(member.id);

    if (user.nametag) {
      // Already has a tag in store — check if the actual Discord nickname matches
      const baseName = member.user.globalName ?? member.user.username;
      const expectedNick = formatNick(baseName, user.nametag);
      const currentNick = member.nickname ?? "";
      if (currentNick === expectedNick) {
        result.skipped++;
        continue;
      }
      // Store tag exists but nickname doesn't match — re-apply
      const res = await applyNametag(member, user.nametag);
      if (res.ok) result.reapplied.push(member.user.username);
      else result.failed.push({ username: member.user.username, reason: res.error ?? "unknown" });
      continue;
    }

    // No tag yet — assign a fresh starter tag (avoid already-used ones)
    const tag = pickStarterTag(usedTags);
    usedTags.add(tag);
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
