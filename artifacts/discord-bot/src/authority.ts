import { Client, Guild, GuildMember, PermissionFlagsBits, Role } from "discord.js";
import { applyNametag } from "./nametags.js";
import { getUser, saveUser } from "./store.js";

// ─── Special authority tags ───────────────────────────────────────────────────
//  These are auto-assigned; they cannot be bought.

export const OWNER_TAG = "forged this realm";
export const ADMIN_TAG = "wields the hammer";

const OWNER_ROLE_NAME = "authority: realm forger";
const ADMIN_ROLE_NAME = "authority: hammer wielder";

const OWNER_COLOR = 0xc0392b;   // deep crimson
const ADMIN_COLOR = 0x2980b9;   // steel blue

// ─── Role helpers ─────────────────────────────────────────────────────────────

async function getOrCreateRole(guild: Guild, name: string, color: number): Promise<Role> {
  const existing = guild.roles.cache.find((r) => r.name === name);
  if (existing) return existing;
  return guild.roles.create({
    name,
    color,
    hoist: true,
    reason: "Authority role — auto-created by bot",
  });
}

// ─── Single member assignment ─────────────────────────────────────────────────

export async function applyAuthorityTag(member: GuildMember): Promise<void> {
  try {
    const isOwner = member.guild.ownerId === member.id;
    const isAdmin =
      !isOwner &&
      member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isOwner && !isAdmin) {
      // Remove authority roles if they somehow have one
      const ownerRole = member.guild.roles.cache.find((r) => r.name === OWNER_ROLE_NAME);
      const adminRole = member.guild.roles.cache.find((r) => r.name === ADMIN_ROLE_NAME);
      if (ownerRole && member.roles.cache.has(ownerRole.id))
        await member.roles.remove(ownerRole).catch(() => null);
      if (adminRole && member.roles.cache.has(adminRole.id))
        await member.roles.remove(adminRole).catch(() => null);
      return;
    }

    const tag = isOwner ? OWNER_TAG : ADMIN_TAG;
    const roleName = isOwner ? OWNER_ROLE_NAME : ADMIN_ROLE_NAME;
    const roleColor = isOwner ? OWNER_COLOR : ADMIN_COLOR;

    // Remove the opposite authority role if held
    const oppositeRoleName = isOwner ? ADMIN_ROLE_NAME : OWNER_ROLE_NAME;
    const oppositeRole = member.guild.roles.cache.find((r) => r.name === oppositeRoleName);
    if (oppositeRole && member.roles.cache.has(oppositeRole.id)) {
      await member.roles.remove(oppositeRole).catch(() => null);
    }

    const role = await getOrCreateRole(member.guild, roleName, roleColor);

    if (!member.roles.cache.has(role.id)) {
      await member.roles.add(role);
    }

    // Apply the nametag (overrides any purchased nametag for authority members)
    const user = getUser(member.id);
    const hadAuthorityTag =
      user.nametag === OWNER_TAG || user.nametag === ADMIN_TAG;

    if (!hadAuthorityTag || user.nametag !== tag) {
      await applyNametag(member, tag);
      // Store as powerTag so !inventory reflects it
      user.powerTag = tag;
      saveUser(member.id, user);
    }
  } catch (err) {
    console.error(`[authority] Failed to apply authority tag to ${member.displayName}:`, err);
  }
}

// ─── Guild-wide scan ──────────────────────────────────────────────────────────

export async function scanGuildAuthority(guild: Guild): Promise<void> {
  try {
    const members = await guild.members.fetch();
    for (const [, member] of members) {
      await applyAuthorityTag(member);
    }
    console.log(`[authority] Scanned ${members.size} members in "${guild.name}"`);
  } catch (err) {
    console.error("[authority] Guild scan failed:", err);
  }
}
