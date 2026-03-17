import { describe, it, expect, beforeEach, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";

const tmpDir = path.join(os.tmpdir(), "add-product-test-" + Date.now());
const catalogPath = path.join(tmpDir, "catalog.json");

function writeCatalog(data: any) {
  fs.writeFileSync(catalogPath, JSON.stringify(data, null, 2) + "\n");
}

function readCatalog() {
  return JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
}

/** Simulates the fabric update logic from add-product.ts without AI calls */
function updateDesignFabric(catalog: any, sku: string, fabric: any) {
  const design = catalog.designs.find((d: any) =>
    d.variants.some((v: any) => v.sku === sku)
  );
  if (!design) throw new Error(`SKU "${sku}" not found in catalog`);
  design.fabric = { ...design.fabric, ...fabric };
  return catalog;
}

const baseCatalog = {
  designs: [
    {
      id: "tul-bornova",
      curtain_type: "TUL",
      design: "BORNOVA",
      width_cm: 320,
      price: 230,
      composition: null,
      fabric: {
        material: "polyester",
        transparency: "sheer",
        texture: null,
        weight: "light",
        pattern: null,
      },
      shopify: {
        product_id: null,
        handle: "tul-bornova",
        product_type: "TUL",
        status: "ACTIVE",
        options: ["Renk"],
      },
      variants: [
        {
          sku: "TUL-001",
          colour: "BEYAZ",
          finish: null,
          swatch: "01-cropped-katalog-images/TUL/TUL-001.JPG",
          shopify: { variant_id: null, status: "ACTIVE" },
        },
        {
          sku: "TUL-002",
          colour: "NATUREL",
          finish: null,
          swatch: "01-cropped-katalog-images/TUL/TUL-002.JPG",
          shopify: { variant_id: null, status: "ACTIVE" },
        },
      ],
    },
    {
      id: "fon-hurrem",
      curtain_type: "FON",
      design: "HÜRREM",
      width_cm: 310,
      price: 350,
      composition: null,
      fabric: {
        material: "polyester",
        transparency: "opaque",
        texture: "smooth woven",
        weight: "heavy",
        pattern: null,
      },
      shopify: {
        product_id: "gid://shopify/Product/123",
        handle: "fon-hurrem",
        product_type: "FON",
        status: "ACTIVE",
        options: ["Renk"],
      },
      variants: [
        {
          sku: "FON-001",
          colour: "427",
          finish: null,
          swatch: "01-cropped-katalog-images/FON/FON-001.JPG",
          shopify: { variant_id: "gid://shopify/ProductVariant/456", status: "ACTIVE" },
        },
      ],
    },
  ],
};

beforeEach(() => {
  fs.mkdirSync(tmpDir, { recursive: true });
  writeCatalog(JSON.parse(JSON.stringify(baseCatalog)));
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("add-product fabric update logic", () => {
  it("updates fabric for the design that owns the SKU", () => {
    const catalog = readCatalog();
    const newFabric = {
      material: "polyester",
      transparency: "sheer",
      texture: "fine woven mesh",
      weight: "light",
      pattern: null,
    };

    const updated = updateDesignFabric(catalog, "TUL-001", newFabric);
    const design = updated.designs.find((d: any) => d.id === "tul-bornova");
    expect(design.fabric.texture).toBe("fine woven mesh");
  });

  it("fabric update applies to all variants of the design", () => {
    const catalog = readCatalog();
    updateDesignFabric(catalog, "TUL-001", { texture: "textured mesh" });

    // TUL-002 is also in tul-bornova, so it benefits from the same fabric update
    const design = catalog.designs.find((d: any) => d.id === "tul-bornova");
    expect(design.variants).toHaveLength(2);
    expect(design.fabric.texture).toBe("textured mesh");
  });

  it("throws when SKU is not found", () => {
    const catalog = readCatalog();
    expect(() => updateDesignFabric(catalog, "TUL-999", { texture: "x" })).toThrow(
      'SKU "TUL-999" not found in catalog'
    );
  });

  it("preserves existing shopify IDs when updating fabric", () => {
    const catalog = readCatalog();
    updateDesignFabric(catalog, "FON-001", { texture: "velvet" });

    const design = catalog.designs.find((d: any) => d.id === "fon-hurrem");
    expect(design.shopify.product_id).toBe("gid://shopify/Product/123");
    expect(design.variants[0].shopify.variant_id).toBe("gid://shopify/ProductVariant/456");
  });

  it("does not affect other designs", () => {
    const catalog = readCatalog();
    updateDesignFabric(catalog, "TUL-001", { texture: "gauze" });

    const fonDesign = catalog.designs.find((d: any) => d.id === "fon-hurrem");
    expect(fonDesign.fabric.texture).toBe("smooth woven");
  });
});
