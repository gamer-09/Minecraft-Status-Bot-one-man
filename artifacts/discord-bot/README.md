# Minecraft Discord Bot

A Discord bot for monitoring your Falix Minecraft server — tracks player joins/leaves, shows real-time server status, and provides slash commands for your community.

## Features

- `/status` — Live server status (online/offline, players, version, ping)
- `/ip` — How to connect to the server
- `/players` — Who's online right now
- `/ping` — Server response time
- `/help` — All commands
- **Auto-updates** — Posts a live status embed in your chosen channel every 30 seconds
- **Player alerts** — Announces when players join or leave
- **Online/offline alerts** — Notifies when the server goes down or comes back

## Environment Variables

Set these in your hosting provider (Render):

| Variable | Description |
|---|---|
| `DISCORD_BOT_TOKEN` | Your Discord bot token |
| `DISCORD_CLIENT_ID` | Your Discord app/client ID |
| `STATUS_CHANNEL_ID` | Channel ID where status updates are posted |
| `MC_HOST` | Minecraft server hostname (default: `oneman.falixsrv.me`) |
| `MC_PORT` | Minecraft server port (default: `25565`) |
| `MC_QUERY_HOST` | Minecraft query/direct IP (default: `162.55.100.208`) |
| `MC_QUERY_PORT` | Minecraft query port (default: `25565`) |

## Deploy to Render

1. Push this folder to a GitHub repo (you can push just `artifacts/discord-bot/`)
2. Go to [render.com](https://render.com) → New → **Web Service** (or Background Worker)
3. Connect your GitHub repo
4. Set **Build Command**: `npm install && npm run build`
5. Set **Start Command**: `node dist/index.js`
6. Add all environment variables above under **Environment**
7. Click **Deploy**

> **Tip:** Use a **Background Worker** on Render (not a Web Service) so it runs 24/7 without needing HTTP traffic to stay alive.

## Getting Your IDs

- **Bot Token**: [discord.com/developers/applications](https://discord.com/developers/applications) → Your App → Bot → Token
- **Client ID**: Same page → General Information → Application ID
- **Channel ID**: In Discord, right-click a channel → Copy Channel ID (enable Developer Mode in User Settings → Advanced first)

## Local Development

```bash
cp .env.example .env
# Fill in .env with your values
npm install
npm run dev
```
