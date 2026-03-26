import postgres from "postgres";

// sql is initialized lazily in initDb(). Handlers must only be called after initDb() runs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let sql: postgres.Sql = null as any;

const CREATE_CART_ITEMS = `
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

const CREATE_CART_ITEMS_INDEX = `
  CREATE UNIQUE INDEX IF NOT EXISTS cart_items_token_variant_idx
  ON cart_items(cart_token, variant_id)
`;

const ALTER_ADD_PRODUCT_ID = `
  ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS product_id BIGINT
`;

const CREATE_DRAFT_ORDERS = `
  CREATE TABLE IF NOT EXISTS draft_orders (
    id SERIAL PRIMARY KEY,
    cart_token TEXT NOT NULL,
    shopify_draft_order_id BIGINT NOT NULL,
    invoice_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`;

const CREATE_DRAFT_ORDERS_INDEX = `
  CREATE UNIQUE INDEX IF NOT EXISTS draft_orders_shopify_id_idx
  ON draft_orders(shopify_draft_order_id)
`;

const CREATE_DRAFT_ORDERS_TOKEN_INDEX = `
  CREATE INDEX IF NOT EXISTS draft_orders_cart_token_idx
  ON draft_orders(cart_token)
`;

async function cleanup() {
  await sql`DELETE FROM cart_items WHERE created_at < NOW() - INTERVAL '7 days'`;
  await sql`DELETE FROM draft_orders WHERE status = 'pending' AND created_at < NOW() - INTERVAL '7 days'`;
}

export async function initDb(): Promise<void> {
  const url = process.env.CURTAIN_DATABASE_URL;
  if (!url) {
    throw new Error("CURTAIN_DATABASE_URL is required");
  }
  sql = postgres(url);
  await sql.unsafe(CREATE_CART_ITEMS);
  await sql.unsafe(CREATE_CART_ITEMS_INDEX);
  await sql.unsafe(ALTER_ADD_PRODUCT_ID);
  await sql.unsafe(CREATE_DRAFT_ORDERS);
  await sql.unsafe(CREATE_DRAFT_ORDERS_INDEX);
  await sql.unsafe(CREATE_DRAFT_ORDERS_TOKEN_INDEX);
  await cleanup();
  setInterval(cleanup, 24 * 60 * 60 * 1000);
}
