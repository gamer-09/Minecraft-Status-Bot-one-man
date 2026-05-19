import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

interface BotConfig {
  statusChannelId?: string;
}

function load(): BotConfig {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(CONFIG_FILE)) return {};
    return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8")) as BotConfig;
  } catch {
    return {};
  }
}

function save(data: BotConfig): void {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
}

export function getStatusChannelId(fallback?: string): string | undefined {
  return load().statusChannelId ?? fallback;
}

export function setStatusChannelId(channelId: string): void {
  const data = load();
  data.statusChannelId = channelId;
  save(data);
}
