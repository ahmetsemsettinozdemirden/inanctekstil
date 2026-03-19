/**
 * Integration tests for /api/jobs and /api/images — uses real pms_test DB.
 */
import { describe, it, expect, afterAll, beforeEach } from "vitest";
import { Hono } from "hono";
import { AppError } from "../../src/errors/base.ts";
import { createTestDb, clearTables, seedFixtures } from "./setup.ts";

import { jobsRouter } from "../../src/routes/jobs.ts";
import { imagesRouter } from "../../src/routes/images.ts";
import { enqueueJob, getJob } from "../../src/lib/job-queue.ts";
import { generatedImages, jobs } from "../../src/db/schema.ts";
import { eq } from "drizzle-orm";

const app = new Hono();
app.route("/api/jobs", jobsRouter);
app.route("/api/images", imagesRouter);
app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: err.code, message: err.message }, err.statusCode as Parameters<typeof c.json>[1]);
  }
  return c.json({ error: "INTERNAL_ERROR", message: err.message }, 500);
});

const { db, client } = createTestDb();

afterAll(async () => {
  await client.end();
});

beforeEach(async () => {
  await clearTables(db);
  await seedFixtures(db);
});

// ---------------------------------------------------------------------------
// GET /api/jobs
// ---------------------------------------------------------------------------

describe("GET /api/jobs", () => {
  it("returns empty list when no jobs exist", async () => {
    const res = await app.request("/api/jobs");
    expect(res.status).toBe(200);
    const body = await res.json() as unknown[];
    expect(body).toHaveLength(0);
  });

  it("returns enqueued jobs newest-first", async () => {
    await enqueueJob("texture", { sku: "TUL-001" });
    await enqueueJob("texture", { sku: "TUL-002" });

    const res = await app.request("/api/jobs");
    const body = await res.json() as Array<{ type: string; status: string; params: { sku: string } }>;
    expect(body).toHaveLength(2);
    expect(body.every((j) => j.status === "pending")).toBe(true);
    // newest first
    expect(body[0].params.sku).toBe("TUL-002");
    expect(body[1].params.sku).toBe("TUL-001");
  });
});

// ---------------------------------------------------------------------------
// GET /api/jobs/:id
// ---------------------------------------------------------------------------

describe("GET /api/jobs/:id", () => {
  it("returns job by id", async () => {
    const jobId = await enqueueJob("texture", { sku: "TUL-001" });
    const res = await app.request(`/api/jobs/${jobId}`);
    expect(res.status).toBe(200);
    const body = await res.json() as { id: string; type: string; params: { sku: string } };
    expect(body.id).toBe(jobId);
    expect(body.type).toBe("texture");
    expect(body.params.sku).toBe("TUL-001");
  });

  it("returns 404 for unknown job id", async () => {
    const res = await app.request("/api/jobs/doesnotexist");
    expect(res.status).toBe(404);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("JOB_NOT_FOUND");
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/jobs/:id
// ---------------------------------------------------------------------------

describe("DELETE /api/jobs/:id", () => {
  it("cancels a pending job", async () => {
    const jobId = await enqueueJob("texture", { sku: "TUL-001" });
    const res = await app.request(`/api/jobs/${jobId}`, { method: "DELETE" });
    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe("cancelled");
  });

  it("returns 404 for unknown job", async () => {
    const res = await app.request("/api/jobs/ghost", { method: "DELETE" });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// POST /api/images/generate
// ---------------------------------------------------------------------------

describe("POST /api/images/generate", () => {
  it("enqueues a texture job and returns jobId", async () => {
    const res = await app.request("/api/images/generate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ sku: "TUL-001", flow: "texture" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as { jobId: string };
    expect(typeof body.jobId).toBe("string");
    expect(body.jobId).toHaveLength(8);

    const job = await getJob(body.jobId);
    expect(job?.type).toBe("texture");
    expect(job?.status).toBe("pending");
    expect((job?.params as { sku: string }).sku).toBe("TUL-001");
  });

  it("enqueues a lifestyle job with roomId", async () => {
    const res = await app.request("/api/images/generate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ sku: "TUL-001", flow: "lifestyle", roomId: "room-01-terracotta-wall" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as { jobId: string };
    const job = await getJob(body.jobId);
    expect(job?.type).toBe("lifestyle");
    expect((job?.params as { roomId: string }).roomId).toBe("room-01-terracotta-wall");
  });

  it("returns 400 when sku is missing", async () => {
    const res = await app.request("/api/images/generate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ flow: "texture" }),
    });
    expect(res.status).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("JOB_ENQUEUE_ERROR");
  });

  it("returns 400 when lifestyle roomId is missing", async () => {
    const res = await app.request("/api/images/generate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ sku: "TUL-001", flow: "lifestyle" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for unknown sku", async () => {
    const res = await app.request("/api/images/generate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ sku: "FAKE-999", flow: "texture" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid flow value", async () => {
    const res = await app.request("/api/images/generate", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ sku: "TUL-001", flow: "invalid" }),
    });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /api/images/generate-bulk
// ---------------------------------------------------------------------------

describe("POST /api/images/generate-bulk", () => {
  it("enqueues a bulk-generate job", async () => {
    const res = await app.request("/api/images/generate-bulk", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ designId: "tul-bornova" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as { jobId: string };
    expect(typeof body.jobId).toBe("string");

    const job = await getJob(body.jobId);
    expect(job?.type).toBe("bulk-generate");
    expect((job?.params as { designId: string }).designId).toBe("tul-bornova");
  });

  it("returns 400 when designId is missing", async () => {
    const res = await app.request("/api/images/generate-bulk", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("returns 404 for unknown designId", async () => {
    const res = await app.request("/api/images/generate-bulk", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ designId: "nonexistent" }),
    });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// POST /api/images/analyze
// ---------------------------------------------------------------------------

describe("POST /api/images/analyze", () => {
  it("enqueues an analyze-swatch job", async () => {
    const res = await app.request("/api/images/analyze", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ sku: "TUL-001" }),
    });
    expect(res.status).toBe(201);
    const body = await res.json() as { jobId: string };
    const job = await getJob(body.jobId);
    expect(job?.type).toBe("analyze-swatch");
    expect((job?.params as { sku: string }).sku).toBe("TUL-001");
  });

  it("returns 400 when sku is missing", async () => {
    const res = await app.request("/api/images/analyze", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for unknown sku", async () => {
    const res = await app.request("/api/images/analyze", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ sku: "FAKE-999" }),
    });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/jobs/:id — non-cancellable states
// ---------------------------------------------------------------------------

describe("DELETE /api/jobs/:id — non-cancellable", () => {
  it("returns 409 when job is already done", async () => {
    const jobId = await enqueueJob("texture", { sku: "TUL-001" });

    // Manually move it to done status
    await db.update(jobs).set({ status: "done", endedAt: new Date() })
      .where(eq(jobs.id, jobId));

    const res = await app.request(`/api/jobs/${jobId}`, { method: "DELETE" });
    expect(res.status).toBe(409);
    const body = await res.json() as { error: string };
    expect(body.error).toBe("JOB_NOT_CANCELLABLE");
  });
});

// ---------------------------------------------------------------------------
// GET /api/images/rooms/list
// ---------------------------------------------------------------------------

describe("GET /api/images/rooms/list", () => {
  it("returns array of room definitions from manifest", async () => {
    const res = await app.request("/api/images/rooms/list");
    expect(res.status).toBe(200);
    const body = await res.json() as Array<{ id: string; room_type: string; wall_color: string }>;
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
    const first = body[0];
    expect(typeof first.id).toBe("string");
    expect(typeof first.room_type).toBe("string");
    expect(typeof first.wall_color).toBe("string");
    // Check known rooms are present
    const ids = body.map((r) => r.id);
    expect(ids).toContain("room-01-terracotta-wall");
    expect(ids).toContain("room-04-dark-green");
  });

  it("returns all 4 rooms", async () => {
    const res = await app.request("/api/images/rooms/list");
    const body = await res.json() as unknown[];
    expect(body).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// GET /api/images/:sku
// ---------------------------------------------------------------------------

describe("GET /api/images/:sku", () => {
  it("returns empty lifestyle and null texture when no images exist", async () => {
    const res = await app.request("/api/images/TUL-001");
    expect(res.status).toBe(200);
    const body = await res.json() as { lifestyle: unknown[]; texture: null };
    expect(body.lifestyle).toHaveLength(0);
    expect(body.texture).toBeNull();
  });

  it("separates lifestyle and texture images correctly", async () => {
    await db.insert(generatedImages).values([
      { sku: "TUL-001", imageType: "lifestyle", roomId: "room-01-terracotta-wall", filePath: "TUL/TUL-001/img1.webp" },
      { sku: "TUL-001", imageType: "lifestyle", roomId: "room-02-wine-wall", filePath: "TUL/TUL-001/img2.webp" },
      { sku: "TUL-001", imageType: "texture", roomId: null, filePath: "TUL/TUL-001/texture.webp" },
    ]);

    const res = await app.request("/api/images/TUL-001");
    const body = await res.json() as {
      lifestyle: Array<{ roomId: string }>;
      texture: { imageType: string } | null;
    };
    expect(body.lifestyle).toHaveLength(2);
    expect(body.texture).not.toBeNull();
    expect(body.texture!.imageType).toBe("texture");
  });
});
