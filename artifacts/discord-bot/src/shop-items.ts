export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  price: number;
  type: "nametag" | "boost" | "shield" | "vip" | "power";
  tagValue?: string;
  duration?: number;
  roleColor?: number;
  hoisted?: boolean;
  vipAccess?: boolean;
}

export const SHOP_ITEMS: ShopItem[] = [
  // ─── Nametags ────────────────────────────────────────────────────────────────
  {
    id: "tag_haunts",
    name: "haunts the ancient halls",
    emoji: "🌿",
    description: "Adds `[haunts the ancient halls]` to your name.",
    price: 100,
    type: "nametag",
    tagValue: "haunts the ancient halls",
  },
  {
    id: "tag_endermen",
    name: "speaks the void tongue",
    emoji: "👁️",
    description: "Adds `[speaks the void tongue]` to your name.",
    price: 300,
    type: "nametag",
    tagValue: "speaks the void tongue",
  },
  {
    id: "tag_walls",
    name: "breaker of old seals",
    emoji: "🌑",
    description: "Adds `[breaker of old seals]` to your name.",
    price: 500,
    type: "nametag",
    tagValue: "breaker of old seals",
  },
  {
    id: "tag_dragon",
    name: "slayer of the end dragon",
    emoji: "🐉",
    description: "Adds `[slayer of the end dragon]` to your name.",
    price: 750,
    type: "nametag",
    tagValue: "slayer of the end dragon",
  },
  {
    id: "tag_answers",
    name: "bows to no kingdom",
    emoji: "⚔️",
    description: "Adds `[bows to no kingdom]` to your name.",
    price: 1000,
    type: "nametag",
    tagValue: "bows to no kingdom",
  },
  {
    id: "tag_sky",
    name: "built beyond the heavens",
    emoji: "👑",
    description: "The rarest tag. Adds `[built beyond the heavens]` to your name.",
    price: 2000,
    type: "nametag",
    tagValue: "built beyond the heavens",
  },

  // ─── Power Tags ───────────────────────────────────────────────────────────────
  {
    id: "power_fire",
    name: "scorched by dragonfire",
    emoji: "🔴",
    description: "Your username burns **fiery red** — as if scorched by the ender dragon.",
    price: 400,
    type: "power",
    roleColor: 0xe74c3c,
  },
  {
    id: "power_gold",
    name: "blessed by thunder gods",
    emoji: "🟡",
    description: "Your username shines **ancient gold** — touched by the gods of the storm.",
    price: 600,
    type: "power",
    roleColor: 0xf1c40f,
  },
  {
    id: "power_ocean",
    name: "risen from the deep",
    emoji: "🔵",
    description: "Your username runs **ocean blue** — risen from the elder guardian's domain.",
    price: 600,
    type: "power",
    roleColor: 0x3498db,
  },
  {
    id: "power_void",
    name: "consumed by the void",
    emoji: "🟣",
    description: "Your username pulses **void purple** — claimed by the darkness beyond the End.",
    price: 800,
    type: "power",
    roleColor: 0x8e44ad,
  },
  {
    id: "power_emerald",
    name: "bearer of emerald crown",
    emoji: "💚",
    description: "Your username glows **emerald green** — marked by the ancient trading lords.",
    price: 800,
    type: "power",
    roleColor: 0x2ecc71,
  },
  {
    id: "power_key",
    name: "keeper of forbidden gate",
    emoji: "🔑",
    description: "Unlocks the **secret VIP channel**. Your name burns with ancient **orange flame**.",
    price: 1500,
    type: "power",
    roleColor: 0xe67e22,
    vipAccess: true,
  },
  {
    id: "power_above",
    name: "ascended above all",
    emoji: "⬆️",
    description: "Your name appears **at the top of the member list**, shining in ancient gold.",
    price: 2500,
    type: "power",
    roleColor: 0xf1c40f,
    hoisted: true,
  },

  // ─── Battle Items ─────────────────────────────────────────────────────────────
  {
    id: "coinboost",
    name: "Coin Boost",
    emoji: "⚡",
    description: "Double your coin reward on your next battle win.",
    price: 200,
    type: "boost",
  },
  {
    id: "shield",
    name: "Battle Shield",
    emoji: "🛡️",
    description: "Automatically blocks your next battle loss. One use.",
    price: 150,
    type: "shield",
  },

  // ─── Privileges ───────────────────────────────────────────────────────────────
  {
    id: "vip_24h",
    name: "VIP Pass",
    emoji: "🌟",
    description: "Get the **VIP** role in this server for **24 hours**.",
    price: 800,
    type: "vip",
    duration: 24,
  },
];

export function getItem(id: string): ShopItem | undefined {
  return SHOP_ITEMS.find((i) => i.id === id);
}

export function findItemByName(name: string): ShopItem | undefined {
  const q = name.toLowerCase();
  return SHOP_ITEMS.find(
    (i) =>
      i.name.toLowerCase() === q ||
      i.id.toLowerCase() === q ||
      i.tagValue?.toLowerCase() === q
  );
}
