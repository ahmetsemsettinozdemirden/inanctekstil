import { describe, it, expect } from "vitest";
import { AppError } from "../../src/errors/base.ts";
import { DesignNotFoundError, VariantNotFoundError, InvalidUpdateError } from "../../src/errors/catalog.ts";
import { ShopifyApiError, ShopifyRateLimitError, ShopifyNotConfiguredError } from "../../src/errors/shopify.ts";
import { JobNotFoundError, JobAlreadyRunningError } from "../../src/errors/jobs.ts";

describe("AppError", () => {
  it("sets all properties correctly", () => {
    const err = new AppError("test message", "TEST_CODE", 418, { key: "value" });
    expect(err.message).toBe("test message");
    expect(err.code).toBe("TEST_CODE");
    expect(err.statusCode).toBe(418);
    expect(err.meta).toEqual({ key: "value" });
  });

  it("defaults to 500 status code", () => {
    const err = new AppError("msg", "CODE");
    expect(err.statusCode).toBe(500);
  });

  it("is instanceof Error", () => {
    const err = new AppError("msg", "CODE");
    expect(err).toBeInstanceOf(Error);
  });

  it("sets name to constructor name", () => {
    const err = new AppError("msg", "CODE");
    expect(err.name).toBe("AppError");
  });
});

describe("DesignNotFoundError", () => {
  it("has correct code and status", () => {
    const err = new DesignNotFoundError("tul-bornova");
    expect(err.code).toBe("DESIGN_NOT_FOUND");
    expect(err.statusCode).toBe(404);
    expect(err.message).toContain("tul-bornova");
    expect(err.meta).toEqual({ id: "tul-bornova" });
  });

  it("is instanceof AppError", () => {
    expect(new DesignNotFoundError("x")).toBeInstanceOf(AppError);
  });
});

describe("VariantNotFoundError", () => {
  it("has correct code and status", () => {
    const err = new VariantNotFoundError("TUL-001");
    expect(err.code).toBe("VARIANT_NOT_FOUND");
    expect(err.statusCode).toBe(404);
    expect(err.meta).toEqual({ sku: "TUL-001" });
  });
});

describe("InvalidUpdateError", () => {
  it("has correct code and status", () => {
    const err = new InvalidUpdateError("bad field", ["foo"]);
    expect(err.code).toBe("INVALID_UPDATE");
    expect(err.statusCode).toBe(400);
    expect(err.meta).toEqual({ fields: ["foo"] });
  });

  it("works without fields", () => {
    const err = new InvalidUpdateError("bad value");
    expect(err.meta).toBeUndefined();
  });
});

describe("ShopifyApiError", () => {
  it("has correct code and status", () => {
    const err = new ShopifyApiError("Shopify failed", [{ message: "not found" }]);
    expect(err.code).toBe("SHOPIFY_API_ERROR");
    expect(err.statusCode).toBe(502);
    expect(err.meta?.errors).toHaveLength(1);
  });
});

describe("ShopifyRateLimitError", () => {
  it("includes retryAfter in meta", () => {
    const err = new ShopifyRateLimitError(2);
    expect(err.code).toBe("SHOPIFY_RATE_LIMIT");
    expect(err.statusCode).toBe(429);
    expect(err.meta?.retryAfter).toBe(2);
  });
});

describe("ShopifyNotConfiguredError", () => {
  it("has 503 status", () => {
    const err = new ShopifyNotConfiguredError();
    expect(err.statusCode).toBe(503);
    expect(err.code).toBe("SHOPIFY_NOT_CONFIGURED");
  });
});

describe("JobNotFoundError", () => {
  it("has correct code and status", () => {
    const err = new JobNotFoundError("abc123");
    expect(err.code).toBe("JOB_NOT_FOUND");
    expect(err.statusCode).toBe(404);
    expect(err.meta).toEqual({ id: "abc123" });
  });
});

describe("JobAlreadyRunningError", () => {
  it("has 409 status", () => {
    const err = new JobAlreadyRunningError("abc123");
    expect(err.code).toBe("JOB_ALREADY_RUNNING");
    expect(err.statusCode).toBe(409);
  });
});
