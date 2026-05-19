export interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  price: number;
  type: "nametag" | "boost" | "shield" | "vip";
  tagValue?: string;   // for nametag items
  duration?: number;   // hours, for timed items
}

export const SHOP_ITEMS: ShopItem[] = [
  // ─── Nametags ────────────────────────────────────────────────────────────────
  {
    id: "tag_newcomer",
    name: "The Newcomer",
    emoji: "🌱",
    description: "A humble beginning. Adds `[The Newcomer]` to your name.",
    price: 100,
    type: "nametag",
    tagValue: "The Newcomer",
  },
  {
    id: "tag_watcher",
    name: "The Watcher",
    emoji: "👁️",
    description: "Silent. Observant. Adds `[The Watcher]` to your name.",
    price: 300,
    type: "nametag",
    tagValue: "The Watcher",
  },
  {
    id: "tag_shadow",
    name: "The Shadow",
    emoji: "🌑",
    description: "You move unseen. Adds `[The Shadow]` to your name.",
    price: 500,
    type: "nametag",
    tagValue: "The Shadow",
  },
  {
    id: "tag_destroyer",
    name: "The Destroyer",
    emoji: "💀",
    description: "Fear the name. Adds `[The Destroyer]` to your name.",
    price: 750,
    type: "nametag",
    tagValue: "The Destroyer",
  },
  {
    id: "tag_legend",
    name: "The Legend",
    emoji: "⚡",
    description: "Few earn this title. Adds `[The Legend]` to your name.",
    price: 1000,
    type: "nametag",
    tagValue: "The Legend",
  },
  {
    id: "tag_champion",
    name: "The Champion",
    emoji: "👑",
    description: "The highest honour. Adds `[The Champion]` to your name.",
    price: 2000,
    type: "nametag",
    tagValue: "The Champion",
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
    (i) => i.name.toLowerCase() === name.toLowerCase() ||
           i.id.toLowerCase() === name.toLowerCase()
  );
}
