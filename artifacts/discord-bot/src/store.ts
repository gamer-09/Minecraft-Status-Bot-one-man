import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

// ─── Config ───────────────────────────────────────────────────────────────────

interface BotConfig {
  statusChannelId?: string;
  shopChannelId?: string;
  vipChannelId?: string;
}

function loadConfig(): BotConfig {
  try {
    ensureDir();
    if (!fs.existsSync(CONFIG_FILE)) return {};
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8")) as BotConfig;
  } catch { return {}; }
}

function saveConfig(data: BotConfig): void {
  ensureDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
}

export function getStatusChannelId(fallback?: string): string | undefined {
  return loadConfig().statusChannelId ?? fallback;
}
export function setStatusChannelId(channelId: string): void {
  const cfg = loadConfig(); cfg.statusChannelId = channelId; saveConfig(cfg);
}
export function clearStatusChannelId(): void {
  const cfg = loadConfig(); delete cfg.statusChannelId; saveConfig(cfg);
}

export function getShopChannelId(): string | undefined {
  return loadConfig().shopChannelId;
}
export function setShopChannelId(channelId: string): void {
  const cfg = loadConfig(); cfg.shopChannelId = channelId; saveConfig(cfg);
}
export function clearShopChannelId(): void {
  const cfg = loadConfig(); delete cfg.shopChannelId; saveConfig(cfg);
}

export function getVipChannelId(): string | undefined {
  return loadConfig().vipChannelId;
}
export function setVipChannelId(channelId: string): void {
  const cfg = loadConfig(); cfg.vipChannelId = channelId; saveConfig(cfg);
}
export function clearVipChannelId(): void {
  const cfg = loadConfig(); delete cfg.vipChannelId; saveConfig(cfg);
}

// ─── Users ────────────────────────────────────────────────────────────────────

export interface ActiveEffect {
  type: "coinboost" | "shield" | "vip";
  expiresAt?: number;
}

export interface UserData {
  balance: number;
  inventory: string[];
  activeEffects: ActiveEffect[];
  battleCooldown?: number;
  nametag?: string;
  powerTag?: string;
}

type UsersFile = Record<string, UserData>;

function loadUsers(): UsersFile {
  try {
    ensureDir();
    if (!fs.existsSync(USERS_FILE)) return {};
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8")) as UsersFile;
  } catch { return {}; }
}

function saveUsers(data: UsersFile): void {
  ensureDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

export function getUser(userId: string): UserData {
  const users = loadUsers();
  if (!users[userId]) {
    users[userId] = { balance: 0, inventory: [], activeEffects: [] };
    saveUsers(users);
  }
  return users[userId];
}

export function saveUser(userId: string, data: UserData): void {
  const users = loadUsers();
  users[userId] = data;
  saveUsers(users);
}

export function addCoins(userId: string, amount: number): number {
  const user = getUser(userId);
  user.balance = Math.max(0, user.balance + amount);
  saveUser(userId, user);
  return user.balance;
}

export function hasItem(userId: string, itemId: string): boolean {
  return getUser(userId).inventory.includes(itemId);
}

export function addItem(userId: string, itemId: string): void {
  const user = getUser(userId);
  if (!user.inventory.includes(itemId)) user.inventory.push(itemId);
  saveUser(userId, user);
}

export function addEffect(userId: string, effect: ActiveEffect): void {
  const user = getUser(userId);
  user.activeEffects = user.activeEffects.filter((e) => e.type !== effect.type);
  user.activeEffects.push(effect);
  saveUser(userId, user);
}

export function consumeEffect(userId: string, type: ActiveEffect["type"]): boolean {
  const user = getUser(userId);
  const idx = user.activeEffects.findIndex((e) => e.type === type);
  if (idx === -1) return false;
  user.activeEffects.splice(idx, 1);
  saveUser(userId, user);
  return true;
}

export function hasEffect(userId: string, type: ActiveEffect["type"]): boolean {
  const user = getUser(userId);
  const now = Date.now();
  return user.activeEffects.some(
    (e) => e.type === type && (e.expiresAt === undefined || e.expiresAt > now)
  );
}
