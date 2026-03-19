import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.ts";
import { DATABASE_URL } from "../lib/env.ts";

const client = postgres(DATABASE_URL);

export const db = drizzle(client, { schema });
