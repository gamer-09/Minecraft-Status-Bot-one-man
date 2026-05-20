import { Collection, Guild, GuildMember, PermissionFlagsBits, Role } from "discord.js";
import { applyNametag } from "./nametags.js";
import { getUser, saveUser } from "./store.js";

// ─── Special authority tags ───────────────────────────────────────────────────

export const OWNER_TAG = "forged this realm";
export const ADMIN_TAG = "wields the hammer";

// Two roles per authority: a dark base color + a vivid glow layer above it.
// Discord shows the color of the highest-positioned role — the glow role sits
// above the base, so the name appears in the bright glowing color. The base
// role is visible in the role panel giving the "base + glow" layered look.

const OWNER_BASE_ROLE  = "authority: realm forger";
const OWNER_GLOW_ROLE  = "authority: realm forger glow";
const OWNER_BASE_COLOR = 0x7f0000; // deep dark crimson (base layer)
const OWNER_GLOW_COLOR = 0xff2d55; // vivid neon red     (glow layer — shown on name)

const ADMIN_BASE_ROLE  = "authority: hammer wielder";
const ADMIN_GLOW_ROLE  = "authority: hammer wielder glow";
const ADMIN_BASE_COLOR = 0x1e3a8a; // deep dark navy    (base layer)
const ADMIN_GLOW_COLOR = 0x38bdf8; // vivid sky blue     (glow layer — shown on name)

const ALL_AUTHORITY_ROLES = [
  OWNER_BASE_ROLE, OWNER_GLOW_ROLE,
  ADMIN_BASE_ROLE, ADMIN_GLOW_ROLE,
];

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

    const tag          = isOwner ? OWNER_TAG        : ADMIN_TAG;
    const baseRoleName = isOwner ? OWNER_BASE_ROLE  : ADMIN_BASE_ROLE;
    const glowRoleName = isOwner ? OWNER_GLOW_ROLE  : ADMIN_GLOW_ROLE;
    const baseColor    = isOwner ? OWNER_BASE_COLOR  : ADMIN_BASE_COLOR;
    const glowColor    = isOwner ? OWNER_GLOW_COLOR  : ADMIN_GLOW_COLOR;

    // Remove the opposite authority's roles
    const oppositeRoles = isOwner
      ? [ADMIN_BASE_ROLE, ADMIN_GLOW_ROLE]
      : [OWNER_BASE_ROLE, OWNER_GLOW_ROLE];
    for (const rn of oppositeRoles) {
      const r = member.guild.roles.cache.find((x) => x.name === rn);
      if (r && member.roles.cache.has(r.id))
        await member.roles.remove(r).catch(() => null);
    }

    // Create/fetch both roles
    const baseRole = await getOrCreateRole(member.guild, baseRoleName, baseColor, false);
    const glowRole = await getOrCreateRole(member.guild, glowRoleName, glowColor, true);

    // Ensure the glow role sits above the base role so its color shows on the name
    if (glowRole.position <= baseRole.position) {
      await glowRole.setPosition(baseRole.position + 1).catch(() => null);
    }

    // Assign both roles
    const toAdd: Role[] = [];
    if (!member.roles.cache.has(baseRole.id)) toAdd.push(baseRole);
    if (!member.roles.cache.has(glowRole.id))  toAdd.push(glowRole);
    if (toAdd.length > 0) await member.roles.add(toAdd);

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
