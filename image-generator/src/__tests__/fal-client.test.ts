import { describe, it, expect } from "vitest";
import { getMimeType } from "../lib/fal-client";

describe("getMimeType", () => {
  it("returns image/jpeg for .jpg", () => {
    expect(getMimeType("photo.jpg")).toBe("image/jpeg");
  });

  it("returns image/jpeg for .jpeg", () => {
    expect(getMimeType("photo.jpeg")).toBe("image/jpeg");
  });

  it("returns image/png for .png", () => {
    expect(getMimeType("image.png")).toBe("image/png");
  });

  it("returns image/webp for .webp", () => {
    expect(getMimeType("output.webp")).toBe("image/webp");
  });

  it("returns image/jpeg as default for unknown extensions", () => {
    expect(getMimeType("file.bmp")).toBe("image/jpeg");
    expect(getMimeType("file.tiff")).toBe("image/jpeg");
  });

  it("handles uppercase extensions via toLowerCase", () => {
    expect(getMimeType("photo.JPG")).toBe("image/jpeg");
    expect(getMimeType("photo.PNG")).toBe("image/png");
  });

  it("handles paths with directories", () => {
    expect(getMimeType("/some/path/to/photo.webp")).toBe("image/webp");
  });
});
