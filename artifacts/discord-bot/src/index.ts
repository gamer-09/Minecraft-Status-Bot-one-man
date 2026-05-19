import "dotenv/config";
import http from "http";
import {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  REST,
  Routes,
} from "discord.js";
import { config } from "./config.js";
import { startMonitor } from "./monitor.js";

import * as statusCmd from "./commands/status.js";
import * as ipCmd from "./commands/ip.js";
import * as playersCmd from "./commands/players.js";
import * as pingCmd from "./commands/ping.js";
import * as helpCmd from "./commands/help.js";
import * as setfeedCmd from "./commands/setfeed.js";

// Minimal HTTP server so Render's port scan succeeds
const PORT = process.env.PORT || 3000;
http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Bot is running.\n");
  })
  .listen(PORT, () => {
    console.log(`Health check server listening on port ${PORT}`);
  });

interface Command {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const commands = new Collection<string, Command>();
const commandList: Command[] = [statusCmd, ipCmd, playersCmd, pingCmd, helpCmd, setfeedCmd];

for (const cmd of commandList) {
  commands.set(cmd.data.name, cmd);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`✅ Logged in as ${readyClient.user.tag}`);

  const rest = new REST().setToken(config.token);
  const body = commandList.map((c) => c.data.toJSON());

  try {
    if (config.guildId) {
      console.log(`Registering slash commands to guild ${config.guildId} (instant)...`);
      await rest.put(
        Routes.applicationGuildCommands(readyClient.user.id, config.guildId),
        { body }
      );
      console.log("✅ Guild slash commands registered instantly.");
    } else {
      console.log("Registering global slash commands (may take up to 1 hour to appear)...");
      await rest.put(Routes.applicationCommands(readyClient.user.id), { body });
      console.log("✅ Global slash commands registered.");
    }
  } catch (err) {
    console.error("Failed to register commands:", err);
  }

  startMonitor(client);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`Error executing /${interaction.commandName}:`, err);
    const reply = { content: "Something went wrong. Please try again.", ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply).catch(() => null);
    } else {
      await interaction.reply(reply).catch(() => null);
    }
  }
});

client.login(config.token).catch((err) => {
  console.error("Failed to login:", err);
  process.exit(1);
});
