/**
 * Integration tests for /api/catalog — uses real pms_test DB.
 * DATABASE_URL is set to pms_test by vitest.config.ts.
 */
import { describe, it, expect, afterAll, beforeEach } from "vitest";
import { Hono } from "hono";
import { AppError } from "../../src/errors/base.ts";
import { createTestDb, clearTables, seedFixtures } from "./setup.ts";
import { catalogRouter } from "../../src/routes/catalog.ts";

const app = new Hono();
app.route("/api/catalog", catalogRouter);
app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: err.code, message: err.message }, err.statusCode as Parameters<typeof c.json>[1]);
  }
  return c.json({ error: "INTERNAL_ERROR", message: err.message }, 500);
});

const { db, client } = createTestDb();

afterAll(async () => {
  await client.end();
});

beforeEach(async () => {
  await clearTables(db);
  await seedFixtures(db);
});

// ---------------------------------------------------------------------------
// GET /api/catalog
// ---------------------------------------------------------------------------

describe("GET /api/catalog", () => {
  it("returns all designs", async () => {
    const res = await app.request("/api/catalog");
    expect(res.status).toBe(200);
    const body = await res.json() as unknown[];
    expect(body).toHaveLength(1);
  });

  it("includes variants and shopify fields", async () => {
    const res = await app.request("/api/catalog");
    const body = await res.json() as Array<{
      id: string;
      variants: unknown[];
      shopify: { product_id: null; status: string };
    }>;
    const design = body[0];
    expect(design.id).toBe("tul-bornova");
    expect(design.variants).toHaveLength(2);
    expect(design.shopify.product_id).toBeNull();
    expect(design.shopify.status).toBe("DRAFT");
  });
});

// ---------------------------------------------------------------------------
// GET /api/catalog/:id
// ---------------------------------------------------------------------------

describe("GET /api/catalog/:id", () => {
  it("returns design by id", async () => {
    const res = await app.request("/api/catalog/tul-bornova");
    expect(res.status).toBe(200);
    const body = await res.json() as { id: string; design: string; price: number };
    expect(body.id).toBe("tul-bornova");
    expect(body.design).toBe("BORNOVA");
    expect(body.price).toBe(230);
  });

  it("returns 404 for unknown design", async () => {
    const res = await app.request("/api/catalog/nonexistent");
    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("DESIGN_NOT_FOUND");
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/catalog/:id
// ---------------------------------------------------------------------------

describe("PATCH /api/catalog/:id", () => {
  it("updates price", async () => {
    const res = await app.request("/api/catalog/tul-bornova", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ price: 350 }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { price: number };
    expect(body.price).toBe(350);
  });

  it("updates composition", async () => {
    const res = await app.request("/api/catalog/tul-bornova", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ composition: "100% Polyester" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { composition: string };
    expect(body.composition).toBe("100% Polyester");
  });

  it("updates fabric fields and preserves unchanged fields", async () => {
    const res = await app.request("/api/catalog/tul-bornova", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ fabric: { material: "linen", weight: "medium" } }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { fabric: { material: string; weight: string; transparency: string } };
    expect(body.fabric.material).toBe("linen");
    expect(body.fabric.weight).toBe("medium");
    expect(body.fabric.transparency).toBe("sheer"); // unchanged
  });

  it("clears composition with null", async () => {
    const res = await app.request("/api/catalog/tul-bornova", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ composition: null }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { composition: null };
    expect(body.composition).toBeNull();
  });

  it("returns 404 for unknown design", async () => {
    const res = await app.request("/api/catalog/nonexistent", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ price: 100 }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 400 for unknown fields", async () => {
    const res = await app.request("/api/catalog/tul-bornova", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ badField: "x" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("INVALID_UPDATE");
  });

  it("returns 400 for invalid price (zero)", async () => {
    const res = await app.request("/api/catalog/tul-bornova", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ price: 0 }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for malformed JSON body", async () => {
    const res = await app.request("/api/catalog/tul-bornova", {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    "not json",
    });
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("INVALID_JSON");
  });
});
