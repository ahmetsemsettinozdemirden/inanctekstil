import { app } from "./app.ts";

const port = parseInt(process.env.PORT ?? "3000", 10);
const server = Bun.serve({ port, fetch: app.fetch });
console.log(JSON.stringify({
  time: new Date().toISOString(),
  level: "INFO",
  msg: "analytics-forwarder ready",
  port: server.port,
}));
