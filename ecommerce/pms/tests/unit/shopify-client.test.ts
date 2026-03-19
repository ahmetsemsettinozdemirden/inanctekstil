import { describe, it, expect, vi } from "vitest";
import { ShopifyClient } from "../../src/lib/shopify-client.ts";
import { ShopifyApiError, ShopifyRateLimitError } from "../../src/errors/shopify.ts";

vi.mock("../../src/lib/logger.ts", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetch(response: unknown, status = 200, headers: Record<string, string> = {}) {
  global.fetch = vi.fn().mockResolvedValue({
    ok:     status < 400,
    status,
    headers: { get: (k: string) => headers[k] ?? null },
    json:   () => Promise.resolve(response),
    text:   () => Promise.resolve(JSON.stringify(response)),
  }) as unknown as typeof fetch;
}

function client() {
  return new ShopifyClient("test.myshopify.com", "test-token");
}

// ---------------------------------------------------------------------------
// createProduct
// ---------------------------------------------------------------------------

describe("ShopifyClient.createProduct", () => {
  it("returns parsed product on success", async () => {
    mockFetch({
      data: {
        productCreate: {
          product: {
            id:     "gid://shopify/Product/1",
            handle: "tul-bornova",
            status: "DRAFT",
            variants: { nodes: [{ id: "gid://shopify/ProductVariant/10", sku: "TUL-001", title: "Beyaz" }] },
          },
          userErrors: [],
        },
      },
    });

    const result = await client().createProduct({
      title:       "TÜL BORNOVA",
      productType: "Tül Perde",
      options:     ["Renk"],
      variants:    [{ sku: "TUL-001", price: "299.00", options: ["Beyaz"] }],
    });

    expect(result.id).toBe("gid://shopify/Product/1");
    expect(result.handle).toBe("tul-bornova");
    expect(result.variants).toHaveLength(1);
    expect(result.variants[0].sku).toBe("TUL-001");
  });

  it("throws ShopifyApiError on userErrors", async () => {
    mockFetch({
      data: {
        productCreate: {
          product:    null,
          userErrors: [{ field: ["title"], message: "Title can't be blank" }],
        },
      },
    });

    await expect(
      client().createProduct({ title: "", productType: "Tül Perde" }),
    ).rejects.toBeInstanceOf(ShopifyApiError);
  });

  it("throws ShopifyApiError on GraphQL-level errors", async () => {
    mockFetch({ errors: [{ message: "Access denied" }] });

    await expect(
      client().createProduct({ title: "TÜL BORNOVA", productType: "Tül Perde" }),
    ).rejects.toBeInstanceOf(ShopifyApiError);
  });

  it("throws ShopifyApiError on HTTP 500", async () => {
    mockFetch({ message: "Server error" }, 500);

    await expect(
      client().createProduct({ title: "TÜL BORNOVA", productType: "Tül Perde" }),
    ).rejects.toBeInstanceOf(ShopifyApiError);
  });
});

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

describe("ShopifyClient rate limiting", () => {
  it("retries on 429 and throws ShopifyRateLimitError after max retries (0ms wait)", async () => {
    // Retry-After: 0 so sleep is instant in tests
    global.fetch = vi.fn().mockResolvedValue({
      ok:     false,
      status: 429,
      headers: { get: (k: string) => k === "Retry-After" ? "0" : null },
      json:   () => Promise.resolve({}),
      text:   () => Promise.resolve("Rate limited"),
    }) as unknown as typeof fetch;

    await expect(
      client().gql("query { shop { name } }"),
    ).rejects.toBeInstanceOf(ShopifyRateLimitError);

    // Should have been called MAX_RETRIES (3) times
    expect((global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// updateProduct
// ---------------------------------------------------------------------------

describe("ShopifyClient.updateProduct", () => {
  it("returns updated product", async () => {
    mockFetch({
      data: {
        productUpdate: {
          product: {
            id:     "gid://shopify/Product/1",
            handle: "tul-bornova",
            status: "ACTIVE",
            variants: { nodes: [] },
          },
          userErrors: [],
        },
      },
    });

    const result = await client().updateProduct("gid://shopify/Product/1", {
      title:       "TÜL BORNOVA",
      productType: "Tül Perde",
    });

    expect(result.status).toBe("ACTIVE");
  });
});

// ---------------------------------------------------------------------------
// setMetafields
// ---------------------------------------------------------------------------

describe("ShopifyClient.setMetafields", () => {
  it("returns saved metafields", async () => {
    mockFetch({
      data: {
        metafieldsSet: {
          metafields: [{
            id:        "gid://shopify/Metafield/1",
            namespace: "custom",
            key:       "composition",
            value:     "100% Polyester",
            type:      "single_line_text_field",
          }],
          userErrors: [],
        },
      },
    });

    const result = await client().setMetafields([{
      ownerId:   "gid://shopify/Product/1",
      namespace: "custom",
      key:       "composition",
      value:     "100% Polyester",
      type:      "single_line_text_field",
    }]);

    expect(result).toHaveLength(1);
    expect(result[0].key).toBe("composition");
  });
});

// ---------------------------------------------------------------------------
// getCollectionByHandle
// ---------------------------------------------------------------------------

describe("ShopifyClient.getCollectionByHandle", () => {
  it("returns collection GID when found", async () => {
    mockFetch({
      data: { collectionByHandle: { id: "gid://shopify/Collection/99" } },
    });

    const id = await client().getCollectionByHandle("tul-perdeler");
    expect(id).toBe("gid://shopify/Collection/99");
  });

  it("returns null when collection not found", async () => {
    mockFetch({ data: { collectionByHandle: null } });
    const id = await client().getCollectionByHandle("nonexistent");
    expect(id).toBeNull();
  });
});
