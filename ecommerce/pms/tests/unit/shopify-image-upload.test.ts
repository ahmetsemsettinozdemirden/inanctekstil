import { describe, it, expect, vi } from "vitest";
import { ShopifyClient } from "../../src/lib/shopify-client.ts";
import { ShopifyApiError } from "../../src/errors/shopify.ts";

vi.mock("../../src/lib/logger.ts", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

function mockFetch(response: unknown, status = 200) {
  global.fetch = vi.fn().mockResolvedValue({
    ok:     status < 400,
    status,
    headers: { get: () => null },
    json:   () => Promise.resolve(response),
    text:   () => Promise.resolve(JSON.stringify(response)),
  }) as unknown as typeof fetch;
}

function client() {
  return new ShopifyClient("test.myshopify.com", "test-token");
}

// ---------------------------------------------------------------------------
// stagedUploadsCreate
// ---------------------------------------------------------------------------

describe("ShopifyClient.stagedUploadsCreate", () => {
  it("returns staged upload targets on success", async () => {
    mockFetch({
      data: {
        stagedUploadsCreate: {
          stagedTargets: [{
            url:         "https://storage.googleapis.com/shopify-staged",
            resourceUrl: "https://cdn.shopify.com/tmp/image.webp",
            parameters:  [{ name: "key", value: "tmp/abc123" }],
          }],
          userErrors: [],
        },
      },
    });

    const targets = await client().stagedUploadsCreate([{
      filename:   "TUL-001-room-01.webp",
      mimeType:   "image/webp",
      httpMethod: "POST",
      resource:   "IMAGE",
      fileSize:   "102400",
    }]);

    expect(targets).toHaveLength(1);
    expect(targets[0].resourceUrl).toBe("https://cdn.shopify.com/tmp/image.webp");
    expect(targets[0].parameters[0].name).toBe("key");
  });

  it("throws ShopifyApiError on userErrors", async () => {
    mockFetch({
      data: {
        stagedUploadsCreate: {
          stagedTargets: [],
          userErrors: [{ field: [], message: "Invalid file type" }],
        },
      },
    });

    await expect(
      client().stagedUploadsCreate([{
        filename: "test.webp", mimeType: "image/webp",
        httpMethod: "POST", resource: "IMAGE", fileSize: "100",
      }]),
    ).rejects.toBeInstanceOf(ShopifyApiError);
  });
});

// ---------------------------------------------------------------------------
// productCreateMedia
// ---------------------------------------------------------------------------

describe("ShopifyClient.productCreateMedia", () => {
  it("returns media with ID and status", async () => {
    mockFetch({
      data: {
        productCreateMedia: {
          media: [{
            id:     "gid://shopify/MediaImage/1",
            status: "UPLOADED",
          }],
          mediaUserErrors: [],
          product: { id: "gid://shopify/Product/1" },
        },
      },
    });

    const media = await client().productCreateMedia("gid://shopify/Product/1", [{
      originalSource: "https://cdn.shopify.com/tmp/image.webp",
      alt: "TUL-001 lifestyle",
    }]);

    expect(media).toHaveLength(1);
    expect(media[0].id).toBe("gid://shopify/MediaImage/1");
    expect(media[0].status).toBe("UPLOADED");
  });

  it("throws ShopifyApiError on mediaUserErrors", async () => {
    mockFetch({
      data: {
        productCreateMedia: {
          media: [],
          mediaUserErrors: [{ field: [], message: "Media upload failed" }],
          product: { id: "gid://shopify/Product/1" },
        },
      },
    });

    await expect(
      client().productCreateMedia("gid://shopify/Product/1", [{
        originalSource: "https://cdn.shopify.com/tmp/bad.webp",
      }]),
    ).rejects.toBeInstanceOf(ShopifyApiError);
  });

  it("filters out media items without id", async () => {
    mockFetch({
      data: {
        productCreateMedia: {
          media: [
            { id: "gid://shopify/MediaImage/1", status: "UPLOADED" },
            { status: "FAILED" },  // no id
          ],
          mediaUserErrors: [],
          product: { id: "gid://shopify/Product/1" },
        },
      },
    });

    const media = await client().productCreateMedia("gid://shopify/Product/1", [
      { originalSource: "https://cdn.shopify.com/tmp/a.webp" },
      { originalSource: "https://cdn.shopify.com/tmp/b.webp" },
    ]);

    expect(media).toHaveLength(1);
    expect(media[0].id).toBe("gid://shopify/MediaImage/1");
  });
});

// ---------------------------------------------------------------------------
// uploadToStagedTarget
// ---------------------------------------------------------------------------

describe("ShopifyClient.uploadToStagedTarget", () => {
  it("posts FormData to the staged URL", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 }) as unknown as typeof fetch;

    const target = {
      url:         "https://storage.googleapis.com/shopify-staged",
      resourceUrl: "https://cdn.shopify.com/tmp/x.webp",
      parameters:  [{ name: "Content-Type", value: "image/webp" }, { name: "key", value: "tmp/x" }],
    };

    await client().uploadToStagedTarget(target, new Uint8Array([1, 2, 3]), "image/webp", "x.webp");

    const fetchCalls = (global.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls;
    expect(fetchCalls).toHaveLength(1);
    expect(fetchCalls[0][0]).toBe("https://storage.googleapis.com/shopify-staged");
    expect(fetchCalls[0][1].method).toBe("POST");
    expect(fetchCalls[0][1].body).toBeInstanceOf(FormData);
  });

  it("throws ShopifyApiError on non-2xx response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 403,
      text: () => Promise.resolve("Access denied"),
    }) as unknown as typeof fetch;

    await expect(
      client().uploadToStagedTarget(
        { url: "https://storage.googleapis.com/x", resourceUrl: "", parameters: [] },
        new Uint8Array([1]),
        "image/webp",
        "x.webp",
      ),
    ).rejects.toBeInstanceOf(ShopifyApiError);
  });
});
