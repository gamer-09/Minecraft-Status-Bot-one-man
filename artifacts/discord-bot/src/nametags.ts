import { GuildMember } from "discord.js";
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
    const user = getUser(member.id);
    user.nametag = tag;
    saveUser(member.id, user);
    return true;
  } catch {
    return false;
  }
}

export async function assignStarterTag(member: GuildMember): Promise<void> {
  const user = getUser(member.id);
  if (user.nametag) return;
  const tag = pickStarterTag();
  await applyNametag(member, tag);
}
