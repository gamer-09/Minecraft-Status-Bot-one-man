import { Collection, Guild, GuildMember, PermissionFlagsBits, Role } from "discord.js";
import { applyNametag } from "./nametags.js";
import { getUser, saveUser } from "./store.js";

// ─── Special authority tags ───────────────────────────────────────────────────

export const OWNER_TAG = "forged this realm";
export const ADMIN_TAG = "wields the hammer";

// Single vivid role per authority. Very bright, saturated colors appear to
// "glow" on Discord's dark background without needing a second role.

const OWNER_ROLE_NAME  = "authority: realm forger";
const OWNER_ROLE_COLOR = 0xff2d55; // neon red-pink — glows on dark background

const ADMIN_ROLE_NAME  = "authority: hammer wielder";
const ADMIN_ROLE_COLOR = 0x38bdf8; // neon sky blue — glows on dark background

const ALL_AUTHORITY_ROLES = [OWNER_ROLE_NAME, ADMIN_ROLE_NAME];

// ─── Role helpers ─────────────────────────────────────────────────────────────

async function getOrCreateRole(
  guild: Guild,
  name: string,
  color: number,
  hoist: boolean,
): Promise<Role> {
  const existing = guild.roles.cache.find((r) => r.name === name);
  if (existing) return existing;
  return guild.roles.create({
    name,
    color,
    hoist,
    reason: "Authority role — auto-created by bot",
  });
}

// ─── Single member assignment ─────────────────────────────────────────────────

export async function applyAuthorityTag(member: GuildMember): Promise<void> {
  if (member.user.bot) return;

  try {
    const isOwner = member.guild.ownerId === member.id;
    const isAdmin =
      !isOwner && member.permissions.has(PermissionFlagsBits.Administrator);

    if (!isOwner && !isAdmin) {
      // Strip all authority roles from non-authority members
      for (const roleName of ALL_AUTHORITY_ROLES) {
        const role = member.guild.roles.cache.find((r) => r.name === roleName);
        if (role && member.roles.cache.has(role.id))
          await member.roles.remove(role).catch(() => null);
      }
      return;
    }

    const tag       = isOwner ? OWNER_TAG        : ADMIN_TAG;
    const roleName  = isOwner ? OWNER_ROLE_NAME  : ADMIN_ROLE_NAME;
    const roleColor = isOwner ? OWNER_ROLE_COLOR : ADMIN_ROLE_COLOR;

    // Remove the opposite authority role
    const oppositeRoleName = isOwner ? ADMIN_ROLE_NAME : OWNER_ROLE_NAME;
    const oppositeRole = member.guild.roles.cache.find((r) => r.name === oppositeRoleName);
    if (oppositeRole && member.roles.cache.has(oppositeRole.id))
      await member.roles.remove(oppositeRole).catch(() => null);

    const role = await getOrCreateRole(member.guild, roleName, roleColor, true);

    // Keep the role color up to date in case it was changed manually
    if (role.color !== roleColor) {
      await role.setColor(roleColor).catch(() => null);
    }

    if (!member.roles.cache.has(role.id)) await member.roles.add(role);

    // Apply nametag
    const user = getUser(member.id);
    const hadAuthorityTag = user.nametag === OWNER_TAG || user.nametag === ADMIN_TAG;

    if (!hadAuthorityTag || user.nametag !== tag) {
      const result = await applyNametag(member, tag);
      if (!result.ok) {
        if (isOwner) {
          console.warn(
            `[authority] Cannot set nickname for owner "${member.user.username}" — Discord blocks bots from changing the server owner's nickname. Set it manually to: ${member.user.username} [${tag}]`
          );
        } else {
          console.warn(
            `[authority] Cannot set nickname for admin "${member.user.username}" — bot role may be below this member in the hierarchy.`
          );
        }
        user.nametag = tag;
      }
      user.powerTag = tag;
      saveUser(member.id, user);
    }
  } catch (err) {
    console.error(`[authority] Failed for ${member.user.username}:`, err);
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
      `[authority] Scanned "${guild.name}": ${processed} humans, ${botsSkipped} bots skipped`
    );
  } catch (err) {
    console.error("[authority] Guild scan failed:", err);
  }
}
