import pino from "pino";
import { LOG_LEVEL, NODE_ENV } from "./env.ts";

export const logger = pino({
  level: LOG_LEVEL,
  transport:
    NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});
