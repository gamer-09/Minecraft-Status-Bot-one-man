import { status, queryFull } from "minecraft-server-util";
import { config } from "./config.js";

export interface ServerStatus {
  online: boolean;
  players: string[];
  playerCount: number;
  maxPlayers: number;
  motd: string;
  version: string;
  ping: number;
}

export async function getServerStatus(): Promise<ServerStatus> {
  try {
    const result = await status(config.mc.host, config.mc.port, { timeout: 5000 });

    let players: string[] = [];

    try {
      const query = await queryFull(config.mc.queryHost, config.mc.queryPort, { timeout: 5000 });
      players = query.players.list ?? [];
    } catch {
      players = result.players?.sample?.map((p) => p.name) ?? [];
    }

    const motdText =
      typeof result.motd === "string"
        ? result.motd
        : result.motd?.raw ?? "A Minecraft Server";

    return {
      online: true,
      players,
      playerCount: result.players.online,
      maxPlayers: result.players.max,
      motd: motdText.replace(/§[0-9a-fk-or]/gi, "").trim(),
      version: result.version.name,
      ping: result.roundTripLatency,
    };
  } catch {
    return {
      online: false,
      players: [],
      playerCount: 0,
      maxPlayers: 0,
      motd: "",
      version: "",
      ping: -1,
    };
  }
}
