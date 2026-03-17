import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { toFabricDescription, toRoomDescription, saveJson, loadManifest } from "../lib/helpers";

describe("toFabricDescription", () => {
  it("maps known curtain types", () => {
    const design = { curtain_type: "TUL", fabric: { pattern: null, material: "polyester", transparency: "sheer", texture: "woven mesh", weight: "light" } };
    const variant = { colour: "white" };
    const result = toFabricDescription(design, variant);
    expect(result.curtain_type).toBe("TUL");
    expect(result.color).toBe("white");
    expect(result.pattern).toBeNull();
    expect(result.material).toBe("polyester");
  });

  it("maps Blackout type", () => {
    const design = { curtain_type: "BLACKOUT", fabric: { pattern: "plain", material: "polyester", transparency: "blackout", texture: "smooth", weight: "heavy" } };
    const variant = { colour: "anthracite" };
    const result = toFabricDescription(design, variant);
    expect(result.curtain_type).toBe("BLACKOUT");
  });

  it("defaults unknown curtain type to Tul", () => {
    const design = { curtain_type: "UnknownType", fabric: { pattern: null, material: "silk", transparency: "sheer", texture: "smooth", weight: "light" } };
    const variant = { colour: "red" };
    const result = toFabricDescription(design, variant);
    expect(result.curtain_type).toBe("TUL");
  });

  it("preserves pattern when not null", () => {
    const design = { curtain_type: "FON", fabric: { pattern: "floral", material: "cotton-blend", transparency: "semi-transparent", texture: "crisp linen", weight: "medium" } };
    const variant = { colour: "cream" };
    const result = toFabricDescription(design, variant);
    expect(result.pattern).toBe("floral");
  });

  it("maps Fon type correctly", () => {
    const design = { curtain_type: "FON", fabric: { pattern: null, material: "polyester", transparency: "opaque", texture: "smooth woven", weight: "heavy" } };
    const variant = { colour: "anthracite" };
    const result = toFabricDescription(design, variant);
    expect(result.curtain_type).toBe("FON");
  });

  it("maps STN type correctly", () => {
    const design = { curtain_type: "STN", fabric: { pattern: null, material: "polyester", transparency: "opaque", texture: "smooth satin", weight: "medium" } };
    const variant = { colour: "gold" };
    const result = toFabricDescription(design, variant);
    expect(result.curtain_type).toBe("STN");
  });

  it("preserves all scalar fields", () => {
    const design = { curtain_type: "TUL", fabric: { pattern: "damask", material: "silk-blend", transparency: "semi-transparent", texture: "soft voile", weight: "medium" } };
    const variant = { colour: "dusty rose" };
    const result = toFabricDescription(design, variant);
    expect(result.color).toBe("dusty rose");
    expect(result.pattern).toBe("damask");
    expect(result.material).toBe("silk-blend");
    expect(result.transparency).toBe("semi-transparent");
    expect(result.texture).toBe("soft voile");
    expect(result.weight).toBe("medium");
  });

  it("uses type-based fallback when texture is null", () => {
    const design = { curtain_type: "FON", fabric: { pattern: null, material: "polyester", transparency: "opaque", texture: null, weight: "heavy" } };
    const variant = { colour: "427" };
    const result = toFabricDescription(design, variant);
    expect(result.texture).toBe("smooth woven");
  });
});

describe("toRoomDescription", () => {
  it("maps all room fields", () => {
    const raw = {
      room_type: "modern living room",
      wall_color: "dark brown",
      floor_type: "light wood parquet",
      props: ["side table", "potted plant"],
      lighting: "natural daylight from window",
      window_type: "large single window with rod",
    };
    const result = toRoomDescription(raw);
    expect(result.room_type).toBe("modern living room");
    expect(result.wall_color).toBe("dark brown");
    expect(result.floor_type).toBe("light wood parquet");
    expect(result.props).toEqual(["side table", "potted plant"]);
    expect(result.lighting).toBe("natural daylight from window");
    expect(result.window_type).toBe("large single window with rod");
  });

  it("handles empty props array", () => {
    const raw = {
      room_type: "bedroom",
      wall_color: "white",
      floor_type: "tile",
      props: [],
      lighting: "ambient",
      window_type: "double window",
    };
    const result = toRoomDescription(raw);
    expect(result.props).toEqual([]);
  });
});

describe("saveJson", () => {
  const tmpDir = path.join(os.tmpdir(), "image-gen-test-" + Date.now());

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates parent directories and writes JSON", () => {
    const filePath = path.join(tmpDir, "nested", "dir", "test.json");
    const data = { key: "value", num: 42 };
    saveJson(filePath, data);

    const written = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    expect(written).toEqual(data);
  });

  it("writes formatted JSON with 2-space indent", () => {
    const filePath = path.join(tmpDir, "format.json");
    saveJson(filePath, { a: 1 });
    const raw = fs.readFileSync(filePath, "utf-8");
    expect(raw).toBe('{\n  "a": 1\n}');
  });

  it("overwrites existing file", () => {
    const filePath = path.join(tmpDir, "overwrite.json");
    saveJson(filePath, { version: 1 });
    saveJson(filePath, { version: 2 });
    const written = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    expect(written).toEqual({ version: 2 });
  });

  it("handles arrays as top-level value", () => {
    const filePath = path.join(tmpDir, "array.json");
    saveJson(filePath, [1, 2, 3]);
    const written = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    expect(written).toEqual([1, 2, 3]);
  });
});

describe("loadManifest", () => {
  const tmpDir = path.join(os.tmpdir(), "image-gen-manifest-test-" + Date.now());

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("loads and parses a JSON manifest file", () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    const manifestPath = path.join(tmpDir, "manifest.json");
    const data = { rooms: {}, banners: {}, collections: {} };
    fs.writeFileSync(manifestPath, JSON.stringify(data));

    const result = loadManifest(manifestPath);
    expect(result).toEqual(data);
  });

  it("throws on missing file", () => {
    expect(() => loadManifest("/nonexistent/manifest.json")).toThrow();
  });

  it("throws on malformed JSON", () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    const badPath = path.join(tmpDir, "bad.json");
    fs.writeFileSync(badPath, "{ not valid json }}}");
    expect(() => loadManifest(badPath)).toThrow();
  });

  it("loads manifest with rooms, banners, and collections", () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    const manifestPath = path.join(tmpDir, "manifest.json");
    const data = {
      rooms: { "room-01": { room_type: "living room" } },
      banners: { "spring-sale": { sku: "TUL-001", headline: "SALE" } },
      collections: { "bahar": { name: "Bahar", skus: ["TUL-001"] } },
    };
    fs.writeFileSync(manifestPath, JSON.stringify(data));

    const result = loadManifest(manifestPath);
    expect(result.rooms["room-01"].room_type).toBe("living room");
    expect(result.banners["spring-sale"].headline).toBe("SALE");
    expect(result.collections["bahar"].skus).toEqual(["TUL-001"]);
  });
});
