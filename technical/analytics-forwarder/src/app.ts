import { Hono } from "hono";

function log(level: "INFO" | "WARN" | "ERROR", msg: string, data?: Record<string, unknown>) {
  const entry = { time: new Date().toISOString(), level, msg, ...data };
  if (level === "ERROR") console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
}

export { log };

export const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok" }));
