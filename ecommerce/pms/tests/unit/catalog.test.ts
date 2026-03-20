import { describe, it, expect, vi } from "vitest";

// Mock db/client before any imports that use it
vi.mock("../../src/db/client.ts", () => ({ db: {} }));

import { mapRowToDesign } from "../../src/lib/catalog.ts";
import type { DesignRow, ShopifyProductRow, VariantRow } from "../../src/db/schema.ts";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseDesign: DesignRow = {
  id:                 "tul-bornova",
  curtainType:        "TUL",
  designName:         "BORNOVA",
  widthCm:            320,
  price:              230,
  composition:        "%80 PES-%20 CO",
  fabricMaterial:     "polyester",
  fabricTransparency: "sheer",
  fabricTexture:      "fine woven mesh",
  fabricWeight:       "light",
  fabricPattern:      null,
  description:        null,
  tags:               null,
  createdAt:          new Date("2025-01-01"),
  updatedAt:          new Date("2025-01-01"),
};

const baseShopify: ShopifyProductRow = {
  designId:    "tul-bornova",
  productId:   "gid://shopify/Product/123",
  handle:      "tul-bornova",
  productType: "TUL",
  status:      "ACTIVE",
  options:     ["Renk"],
  syncedAt:    new Date("2025-01-01"),
};

const variantRow: VariantRow = {
  sku:              "TUL-001",
  designId:         "tul-bornova",
  colour:           "BEYAZ",
  finish:           null,
  swatchPath:       "01-cropped-katalog-images/TUL/TUL-001.JPG",
  shopifyVariantId: "gid://shopify/ProductVariant/456",
  shopifyStatus:    "ACTIVE",
  createdAt:        new Date("2025-01-01"),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("mapRowToDesign", () => {
  it("maps design row fields correctly", () => {
    const result = mapRowToDesign(baseDesign, baseShopify, [variantRow]);

    expect(result.id).toBe("tul-bornova");
    expect(result.curtain_type).toBe("TUL");
    expect(result.design).toBe("BORNOVA");
    expect(result.width_cm).toBe(320);
    expect(result.price).toBe(230);
    expect(result.composition).toBe("%80 PES-%20 CO");
  });

  it("maps fabric fields correctly", () => {
    const result = mapRowToDesign(baseDesign, baseShopify, [variantRow]);

    expect(result.fabric.material).toBe("polyester");
    expect(result.fabric.transparency).toBe("sheer");
    expect(result.fabric.texture).toBe("fine woven mesh");
    expect(result.fabric.weight).toBe("light");
    expect(result.fabric.pattern).toBeNull();
  });

  it("maps shopify fields correctly", () => {
    const result = mapRowToDesign(baseDesign, baseShopify, [variantRow]);

    expect(result.shopify.product_id).toBe("gid://shopify/Product/123");
    expect(result.shopify.handle).toBe("tul-bornova");
    expect(result.shopify.product_type).toBe("TUL");
    expect(result.shopify.status).toBe("ACTIVE");
    expect(result.shopify.options).toEqual(["Renk"]);
  });

  it("maps variant fields correctly", () => {
    const result = mapRowToDesign(baseDesign, baseShopify, [variantRow]);

    expect(result.variants).toHaveLength(1);
    const v = result.variants[0];
    expect(v.sku).toBe("TUL-001");
    expect(v.colour).toBe("BEYAZ");
    expect(v.finish).toBeNull();
    expect(v.swatch).toBe("01-cropped-katalog-images/TUL/TUL-001.JPG");
    expect(v.shopify.variant_id).toBe("gid://shopify/ProductVariant/456");
    expect(v.shopify.status).toBe("ACTIVE");
  });

  it("handles null shopify row (unsynced design)", () => {
    const result = mapRowToDesign(baseDesign, null, [variantRow]);

    expect(result.shopify.product_id).toBeNull();
    expect(result.shopify.handle).toBeNull();
    expect(result.shopify.product_type).toBeNull();
    expect(result.shopify.status).toBe("DRAFT");
    expect(result.shopify.options).toEqual(["Renk"]);
  });

  it("handles multiple variants", () => {
    const variant2: VariantRow = {
      ...variantRow,
      sku:    "TUL-002",
      colour: "KREM",
    };
    const result = mapRowToDesign(baseDesign, baseShopify, [variantRow, variant2]);

    expect(result.variants).toHaveLength(2);
    expect(result.variants[1].sku).toBe("TUL-002");
    expect(result.variants[1].colour).toBe("KREM");
  });

  it("handles empty variants list", () => {
    const result = mapRowToDesign(baseDesign, baseShopify, []);
    expect(result.variants).toHaveLength(0);
  });

  it("handles design with null fabric fields", () => {
    const minimal: DesignRow = {
      ...baseDesign,
      fabricMaterial:     null,
      fabricTransparency: null,
      fabricTexture:      null,
      fabricWeight:       null,
      fabricPattern:      null,
      composition:        null,
    };
    const result = mapRowToDesign(minimal, null, []);

    expect(result.fabric.material).toBeNull();
    expect(result.fabric.texture).toBeNull();
    expect(result.composition).toBeNull();
  });

  it("handles FON design with two options", () => {
    const fonShopify: ShopifyProductRow = {
      ...baseShopify,
      options: ["Renk", "Görünüm"],
      status:  "ACTIVE",
    };
    const result = mapRowToDesign(baseDesign, fonShopify, []);
    expect(result.shopify.options).toEqual(["Renk", "Görünüm"]);
  });
});
