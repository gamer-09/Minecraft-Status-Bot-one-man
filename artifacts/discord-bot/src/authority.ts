import { Collection, Guild, GuildMember, PermissionFlagsBits, Role } from "discord.js";
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
  // Never tag bots — the bot itself has admin perms but should not be tagged
  if (member.user.bot) return;

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
      const ok = await applyNametag(member, tag);
      if (!ok) {
        if (isOwner) {
          // Discord does not allow bots to change the server owner's nickname.
          // Persist the tag in the store so !inventory reflects it correctly.
          console.warn(
            `[authority] Cannot set nickname for owner "${member.user.username}" — Discord blocks bots from changing the owner's nickname. Tag saved to store only. Set your nickname manually to: ${member.user.username} [${tag}]`
          );
        } else {
          // For admins, failure usually means the bot's role is below theirs in the hierarchy.
          console.warn(
            `[authority] Cannot set nickname for admin "${member.user.username}" — bot role may be below this member's role in the server hierarchy. Move the bot's role above all member roles in Server Settings → Roles.`
          );
        }
        user.nametag = tag;
      }
      // Always persist powerTag for authority members regardless of nickname success
      user.powerTag = tag;
      saveUser(member.id, user);
    }
  } catch (err) {
    console.error(`[authority] Failed to apply authority tag to ${member.user.username}:`, err);
  }
}

// ─── Guild-wide scan ──────────────────────────────────────────────────────────

export async function scanGuildAuthority(
  guild: Guild,
  members: Collection<string, GuildMember>,
): Promise<void> {
  try {
    let processed = 0;
    let botsSkipped = 0;

    for (const [, member] of members) {
      if (member.user.bot) { botsSkipped++; continue; }
      await applyAuthorityTag(member);
      processed++;
    }

    console.log(
      `[authority] Scanned "${guild.name}": ${processed} humans processed, ${botsSkipped} bots skipped`
    );
  } catch (err) {
    console.error("[authority] Guild scan failed:", err);
  }
}
