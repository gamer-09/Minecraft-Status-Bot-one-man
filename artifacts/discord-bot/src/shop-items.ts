export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  price: number;
  type: "nametag" | "boost" | "shield" | "vip";
  tagValue?: string;
  duration?: number;
}

export const SHOP_ITEMS: ShopItem[] = [
  // ─── Nametags ────────────────────────────────────────────────────────────────
  {
    id: "tag_haunts",
    name: "haunts the overworld",
    emoji: "🌿",
    description: "Adds `[haunts the overworld]` to your name.",
    price: 100,
    type: "nametag",
    tagValue: "haunts the overworld",
  },
  {
    id: "tag_endermen",
    name: "speaks to endermen",
    emoji: "👁️",
    description: "Adds `[speaks to endermen]` to your name.",
    price: 300,
    type: "nametag",
    tagValue: "speaks to endermen",
  },
  {
    id: "tag_walls",
    name: "walks through walls",
    emoji: "🌑",
    description: "Adds `[walks through walls]` to your name.",
    price: 500,
    type: "nametag",
    tagValue: "walks through walls",
  },
  {
    id: "tag_dragon",
    name: "slew the dragon",
    emoji: "🐉",
    description: "Adds `[slew the dragon]` to your name.",
    price: 750,
    type: "nametag",
    tagValue: "slew the dragon",
  },
  {
    id: "tag_answers",
    name: "answers to no one",
    emoji: "💀",
    description: "Adds `[answers to no one]` to your name.",
    price: 1000,
    type: "nametag",
    tagValue: "answers to no one",
  },
  {
    id: "tag_sky",
    name: "touched the sky limit",
    emoji: "👑",
    description: "The rarest tag. Adds `[touched the sky limit]` to your name.",
    price: 2000,
    type: "nametag",
    tagValue: "touched the sky limit",
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
  return SHOP_ITEMS.find(
    (i) =>
      i.name.toLowerCase() === name.toLowerCase() ||
      i.id.toLowerCase() === name.toLowerCase() ||
      i.tagValue?.toLowerCase() === name.toLowerCase()
  );
}
