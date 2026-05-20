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
    battleChannelId?: string;
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

  export function getBattleChannelId(): string | undefined {
    return loadConfig().battleChannelId;
  }
  export function setBattleChannelId(channelId: string): void {
    const cfg = loadConfig(); cfg.battleChannelId = channelId; saveConfig(cfg);
  }
  export function clearBattleChannelId(): void {
    const cfg = loadConfig(); delete cfg.battleChannelId; saveConfig(cfg);
  }

  // ─── Users ────────────────────────────────────────────────────────────────────

  export interface ActiveEffect {
    type: "coinboost" | "shield" | "vip";
    expiresAt?: number;
  }

  export interface BattleStats {
    wins: number;
    losses: number;
    draws: number;
    coinsEarned: number;
    biggestWin: number;
    streak: number;
    bestStreak: number;
  }

  export interface UserData {
    balance: number;
    inventory: string[];
    activeEffects: ActiveEffect[];
    battleCooldown?: number;
    nametag?: string;
    powerTag?: string;
    battleStats?: BattleStats;
    lastDaily?: number;
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

  export function getAllUsers(): Record<string, UserData> {
    return loadUsers();
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

  function ensureStats(user: UserData): BattleStats {
    if (!user.battleStats) {
      user.battleStats = { wins: 0, losses: 0, draws: 0, coinsEarned: 0, biggestWin: 0, streak: 0, bestStreak: 0 };
    }
    return user.battleStats;
  }

  export function recordBattleWin(userId: string, coinsEarned: number): void {
    const user = getUser(userId);
    const s = ensureStats(user);
    s.wins++;
    s.coinsEarned += coinsEarned;
    if (coinsEarned > s.biggestWin) s.biggestWin = coinsEarned;
    s.streak++;
    if (s.streak > s.bestStreak) s.bestStreak = s.streak;
    saveUser(userId, user);
  }

  export function recordBattleLoss(userId: string): void {
    const user = getUser(userId);
    const s = ensureStats(user);
    s.losses++;
    s.streak = 0;
    saveUser(userId, user);
  }

  export function recordBattleDraw(userId: string): void {
    const user = getUser(userId);
    const s = ensureStats(user);
    s.draws++;
    saveUser(userId, user);
  }

  export const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000;

  export function claimDaily(userId: string): { granted: boolean; reward: number; nextAt: number } {
    const user = getUser(userId);
    const now = Date.now();
    if (user.lastDaily && now < user.lastDaily + DAILY_COOLDOWN_MS) {
      return { granted: false, reward: 0, nextAt: user.lastDaily + DAILY_COOLDOWN_MS };
    }
    const reward = Math.floor(Math.random() * 101) + 50; // 50-150 coins
    user.balance += reward;
    user.lastDaily = now;
    saveUser(userId, user);
    return { granted: true, reward, nextAt: now + DAILY_COOLDOWN_MS };
  }
  