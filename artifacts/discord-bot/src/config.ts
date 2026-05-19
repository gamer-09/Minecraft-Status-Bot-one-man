import "dotenv/config";

export const config = {
  token: process.env.DISCORD_BOT_TOKEN!,
  clientId: process.env.DISCORD_CLIENT_ID!,
  statusChannelId: process.env.STATUS_CHANNEL_ID!,
  mc: {
    host: process.env.MC_HOST || "oneman.falixsrv.me",
    port: parseInt(process.env.MC_PORT || "25565"),
    queryHost: process.env.MC_QUERY_HOST || "162.55.100.208",
    queryPort: parseInt(process.env.MC_QUERY_PORT || "25565"),
  },
};
