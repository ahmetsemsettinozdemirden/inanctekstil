import { app } from "./app.ts";

const port = parseInt(process.env.PORT ?? "3001", 10);
const server = Bun.serve({ port, fetch: app.fetch });
console.log(JSON.stringify({ time: new Date().toISOString(), level: "INFO", msg: "design-your-curtain server ready", port: server.port }));
