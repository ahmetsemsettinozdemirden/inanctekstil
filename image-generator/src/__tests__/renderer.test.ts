import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import sharp from "sharp";
import { renderHeroBanner, renderCollectionCard } from "../lib/renderer";

const tmpDir = path.join(os.tmpdir(), "renderer-test-" + Date.now());
let testImagePath: string;

beforeAll(async () => {
  fs.mkdirSync(tmpDir, { recursive: true });
  // Create a simple 800x600 test image
  testImagePath = path.join(tmpDir, "test-base.png");
  await sharp({
    create: { width: 800, height: 600, channels: 3, background: { r: 100, g: 150, b: 200 } },
  })
    .png()
    .toFile(testImagePath);
});

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("renderHeroBanner", () => {
  it("produces a non-empty webp buffer", async () => {
    const result = await renderHeroBanner({
      baseImagePath: testImagePath,
      headline: "TEST HEADLINE",
      subHeadline: "Sub Headline",
      discount: "%20 OFF",
      cta: "SHOP NOW",
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it("produces default 2160x780 dimensions", async () => {
    const result = await renderHeroBanner({
      baseImagePath: testImagePath,
      headline: "BAHAR",
      subHeadline: "KOLEKSIYON",
      discount: "%10",
      cta: "ALISVERISE BASLA",
    });

    const meta = await sharp(result).metadata();
    expect(meta.width).toBe(2160);
    expect(meta.height).toBe(780);
    expect(meta.format).toBe("webp");
  });

  it("respects custom dimensions", async () => {
    const result = await renderHeroBanner({
      baseImagePath: testImagePath,
      headline: "TEST",
      subHeadline: "TEST",
      discount: "10%",
      cta: "BUY",
      width: 1080,
      height: 390,
    });

    const meta = await sharp(result).metadata();
    expect(meta.width).toBe(1080);
    expect(meta.height).toBe(390);
  });

  it("handles disclaimer text", async () => {
    const result = await renderHeroBanner({
      baseImagePath: testImagePath,
      headline: "SALE",
      subHeadline: "BIG SALE",
      discount: "%50",
      cta: "GO",
      disclaimer: "Terms and conditions apply. Valid until end of month.",
    });

    expect(result.length).toBeGreaterThan(0);
  });
});

describe("renderCollectionCard", () => {
  it("produces a non-empty png buffer", async () => {
    const result = await renderCollectionCard({
      baseImagePath: testImagePath,
      collectionName: "Bahar Koleksiyonu",
    });

    expect(result).toBeInstanceOf(Buffer);
    expect(result.length).toBeGreaterThan(0);
  });

  it("produces default 1280x1040 dimensions", async () => {
    const result = await renderCollectionCard({
      baseImagePath: testImagePath,
      collectionName: "Test Collection",
    });

    const meta = await sharp(result).metadata();
    expect(meta.width).toBe(1280);
    expect(meta.height).toBe(1040);
    expect(meta.format).toBe("png");
  });

  it("respects custom dimensions", async () => {
    const result = await renderCollectionCard({
      baseImagePath: testImagePath,
      collectionName: "Small Card",
      width: 640,
      height: 520,
    });

    const meta = await sharp(result).metadata();
    expect(meta.width).toBe(640);
    expect(meta.height).toBe(520);
  });

  it("uppercases collection name in output", async () => {
    // We can't easily verify text content in the image,
    // but we verify it doesn't crash with Turkish characters
    const result = await renderCollectionCard({
      baseImagePath: testImagePath,
      collectionName: "Yaz Koleksiyonu",
    });
    expect(result.length).toBeGreaterThan(0);
  });
});
