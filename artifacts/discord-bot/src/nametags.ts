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

export function formatNick(displayName: string, tag: string): string {
  const base = displayName.replace(/\s*\[.*?\]\s*$/, "").trim();
  const truncated = base.length > 20 ? base.slice(0, 20) : base;
  return `${truncated} [${tag}]`;
}

export async function applyNametag(member: GuildMember, tag: string): Promise<boolean> {
  try {
    const nick = formatNick(member.displayName, tag);
    await member.setNickname(nick);
    // Only persist to store after the Discord nickname change succeeds
    const user = getUser(member.id);
    user.nametag = tag;
    saveUser(member.id, user);
    return true;
  } catch (err: unknown) {
    // Log per-member failures so they are visible and not silently dropped
    const name = member.displayName ?? member.id;
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[nametags] Could not set nickname for ${name}: ${msg}`);
    return false;
  }
}

export async function assignStarterTag(member: GuildMember): Promise<void> {
  const user = getUser(member.id);
  if (user.nametag) return;
  const tag = pickStarterTag();
  await applyNametag(member, tag);
}

export async function scanAndAssignStarterTags(guild: Guild): Promise<void> {
  try {
    const members = await guild.members.fetch();
    let assigned = 0;
    let skipped = 0;
    let failed = 0;

    for (const [, member] of members) {
      if (member.user.bot) continue;

      const user = getUser(member.id);

      // Skip only if the store confirms a tag AND the current Discord nickname
      // actually contains a bracketed tag — catches the case where a previous
      // run saved the tag in the store but the setNickname call failed.
      if (user.nametag) {
        const currentNick = member.nickname ?? member.user.username;
        const hasTagInNick = /\[.+\]/.test(currentNick);
        if (hasTagInNick) {
          skipped++;
          continue;
        }
        // Store says tagged but nickname is bare — re-apply it
        const ok = await applyNametag(member, user.nametag);
        if (ok) assigned++;
        else failed++;
        continue;
      }

      // Brand-new member (no store entry at all) — assign a fresh starter tag
      const tag = pickStarterTag();
      const ok = await applyNametag(member, tag);
      if (ok) assigned++;
      else failed++;
    }

    console.log(
      `[nametags] Scan complete in "${guild.name}": ` +
      `${assigned} assigned, ${skipped} already tagged, ${failed} failed (no permission)`
    );
  } catch (err) {
    console.error("[nametags] Starter tag scan failed:", err);
  }
}
