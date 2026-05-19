# Minecraft Discord Bot

A Discord bot that monitors a Falix Minecraft server — tracks player joins/leaves, posts real-time status updates, and provides slash commands for Discord members.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

### Discord Bot (deploy to Render, not run here)
- `cd artifacts/discord-bot && npm run build` — compile TypeScript
- `cd artifacts/discord-bot && npm run dev` — run locally with tsx watch (requires `.env`)
- `cd artifacts/discord-bot && npm start` — run compiled bot

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- **Discord Bot**: discord.js v14, minecraft-server-util

## Where things live

- `artifacts/discord-bot/` — the Discord bot (standalone Node.js, deploy to Render)
- `artifacts/discord-bot/src/index.ts` — bot entry point, client setup, slash command handler
- `artifacts/discord-bot/src/monitor.ts` — 30s polling loop, player join/leave detection
- `artifacts/discord-bot/src/minecraft.ts` — server status + query via minecraft-server-util
- `artifacts/discord-bot/src/embeds.ts` — Discord embed builders
- `artifacts/discord-bot/src/commands/` — slash command handlers
- `artifacts/discord-bot/README.md` — full deployment guide for Render
- `artifacts/discord-bot/.env.example` — all required environment variables

## Architecture decisions

- Bot auto-registers slash commands on startup via REST (no separate deploy step needed on Render)
- Player tracking uses a diff of the previous player list (Set comparison every 30s)
- Status embed is edited in-place each tick; a new message is posted only if the old one was deleted
- Query protocol (UDP) used for accurate player names; falls back to status ping if query is disabled
- Dockerfile included for containerised deploys if preferred over Render's native Node buildpack

## Product

Discord bot that gives a Minecraft community:
- `/status` — live server info
- `/ip` — how to join
- `/players` — who's online
- `/ping` — server latency
- `/help` — command list
- Auto-updating status embed posted every 30 seconds
- Player join/leave announcements
- Server online/offline alerts

## User preferences

- Server IP: `oneman.falixsrv.me` (port 25565)
- Direct IP: `162.55.100.208:21190`
- Hosted on Render (Background Worker), not on Replit

## Gotchas

- `STATUS_CHANNEL_ID` must be set or the monitor silently skips posting
- Falix API has been removed — no programmatic server start/stop possible
- Query protocol must be enabled in `server.properties` (`enable-query=true`, `query.port=21190`) for accurate player names

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `artifacts/discord-bot/README.md` for full Render deployment steps
