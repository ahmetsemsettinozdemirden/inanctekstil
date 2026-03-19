import postgres from "postgres";

// sql is initialized lazily in initDb(). Handlers must only be called after initDb() runs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let sql: postgres.Sql = null as any;

const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS cart_items (
    id SERIAL PRIMARY KEY,
    cart_token TEXT NOT NULL,
    variant_id BIGINT NOT NULL,
    product_title TEXT NOT NULL,
    en_cm INT NOT NULL,
    boy_cm INT NOT NULL,
    pile_stili TEXT NOT NULL,
    pile_orani DECIMAL(4,2) NOT NULL,
    kanat TEXT NOT NULL,
    kanat_count INT NOT NULL,
    base_price_per_meter DECIMAL(10,2) NOT NULL,
    calculated_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`;

const CREATE_INDEX = `
  CREATE UNIQUE INDEX IF NOT EXISTS cart_items_token_variant_idx
  ON cart_items(cart_token, variant_id)
`;

const ALTER_ADD_PRODUCT_ID = `
  ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS product_id BIGINT
`;

async function cleanup() {
  await sql`DELETE FROM cart_items WHERE created_at < NOW() - INTERVAL '7 days'`;
}

export async function initDb(): Promise<void> {
  const url = process.env.CURTAIN_DATABASE_URL;
  if (!url) {
    throw new Error("CURTAIN_DATABASE_URL is required");
  }
  sql = postgres(url);
  await sql.unsafe(CREATE_TABLE);
  await sql.unsafe(CREATE_INDEX);
  await sql.unsafe(ALTER_ADD_PRODUCT_ID);
  await cleanup();
  setInterval(cleanup, 24 * 60 * 60 * 1000);
}
