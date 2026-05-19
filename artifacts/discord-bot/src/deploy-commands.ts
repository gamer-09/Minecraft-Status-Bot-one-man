import "dotenv/config";
import { REST, Routes } from "discord.js";
import * as statusCmd from "./commands/status.js";
import * as ipCmd from "./commands/ip.js";
import * as playersCmd from "./commands/players.js";
import * as pingCmd from "./commands/ping.js";
import * as helpCmd from "./commands/help.js";

const token = process.env.DISCORD_BOT_TOKEN!;
const clientId = process.env.DISCORD_CLIENT_ID!;

const commands = [statusCmd, ipCmd, playersCmd, pingCmd, helpCmd].map((c) => c.data.toJSON());

const rest = new REST().setToken(token);

(async () => {
  console.log(`Registering ${commands.length} slash commands...`);
  const data = await rest.put(Routes.applicationCommands(clientId), { body: commands }) as unknown[];
  console.log(`Successfully registered ${data.length} commands.`);
})().catch(console.error);
