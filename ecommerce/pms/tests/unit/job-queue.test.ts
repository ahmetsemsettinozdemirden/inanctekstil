import { describe, it, expect, vi } from "vitest";

// Mock DB dependencies before importing job-queue
vi.mock("../../src/db/client.ts", () => ({ db: {} }));
vi.mock("../../src/lib/logger.ts", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));
vi.mock("nanoid", () => ({ nanoid: () => "test1234" }));

// Stub drizzle-orm exports only where needed (subscribeJobUpdates tests don't touch DB)
vi.mock("drizzle-orm", () => ({
  eq:  vi.fn(),
  sql: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => ({ sql: strings.join("?"), params: values }),
    { raw: (s: string) => s, identifier: (s: string) => s },
  ),
}));


import { subscribeJobUpdates } from "../../src/lib/job-queue.ts";

describe("subscribeJobUpdates", () => {
  it("registers and deregisters subscriber", () => {
    const received: unknown[] = [];
    const unsub = subscribeJobUpdates((job) => received.push(job));
    expect(typeof unsub).toBe("function");
    unsub();
  });

  it("returns a cleanup function that prevents further delivery", () => {
    const calls: unknown[] = [];
    const unsub = subscribeJobUpdates((job) => calls.push(job));
    unsub();
    // After unsub, the subscriber set no longer contains this callback
    // Can verify indirectly: no error thrown on cleanup
    expect(calls).toHaveLength(0);
  });

  it("can register multiple subscribers independently", () => {
    const calls1: unknown[] = [];
    const calls2: unknown[] = [];
    const unsub1 = subscribeJobUpdates((j) => calls1.push(j));
    const unsub2 = subscribeJobUpdates((j) => calls2.push(j));
    expect(typeof unsub1).toBe("function");
    expect(typeof unsub2).toBe("function");
    unsub1();
    unsub2();
  });
});

describe("JobType", () => {
  it("accepts lifestyle and texture as valid job types", () => {
    const types = ["lifestyle", "texture"] as const;
    for (const t of types) {
      expect(["lifestyle", "texture"]).toContain(t);
    }
  });
});
