import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { toFabricDescription, toRoomDescription, saveJson, loadManifest } from "../lib/helpers";

describe("toFabricDescription", () => {
  it("maps known curtain types", () => {
    const raw = {
      curtain_type: "Tul",
      color: "white",
      pattern: null,
      material: "polyester",
      transparency: "sheer",
      texture: "woven mesh",
      weight: "light",
    };
    const result = toFabricDescription(raw);
    expect(result.curtain_type).toBe("Tul");
    expect(result.color).toBe("white");
    expect(result.pattern).toBeNull();
    expect(result.material).toBe("polyester");
  });

  it("maps Blackout type", () => {
    const raw = {
      curtain_type: "Blackout",
      color: "anthracite",
      pattern: "plain",
      material: "polyester",
      transparency: "blackout",
      texture: "smooth",
      weight: "heavy",
    };
    const result = toFabricDescription(raw);
    expect(result.curtain_type).toBe("Blackout");
  });

  it("defaults unknown curtain type to Tul", () => {
    const raw = {
      curtain_type: "UnknownType",
      color: "red",
      pattern: null,
      material: "silk",
      transparency: "sheer",
      texture: "smooth",
      weight: "light",
    };
    const result = toFabricDescription(raw);
    expect(result.curtain_type).toBe("Tul");
  });

  it("preserves pattern when not null", () => {
    const raw = {
      curtain_type: "Fon",
      color: "cream",
      pattern: "floral",
      material: "cotton-blend",
      transparency: "semi-transparent",
      texture: "crisp linen",
      weight: "medium",
    };
    const result = toFabricDescription(raw);
    expect(result.pattern).toBe("floral");
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
});

describe("loadManifest", () => {
  const tmpDir = path.join(os.tmpdir(), "image-gen-manifest-test-" + Date.now());

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("loads and parses a JSON manifest file", () => {
    fs.mkdirSync(tmpDir, { recursive: true });
    const manifestPath = path.join(tmpDir, "manifest.json");
    const data = { products: [], rooms: {} };
    fs.writeFileSync(manifestPath, JSON.stringify(data));

    const result = loadManifest(manifestPath);
    expect(result).toEqual(data);
  });

  it("throws on missing file", () => {
    expect(() => loadManifest("/nonexistent/manifest.json")).toThrow();
  });
});
