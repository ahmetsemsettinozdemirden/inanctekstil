import { Hono } from "hono";
import { stream } from "hono/streaming";
import { getJob, getJobs, cancelJob, subscribeJobUpdates } from "../lib/job-queue.ts";
import { JobNotFoundError } from "../errors/jobs.ts";
import type { JobRow } from "../db/schema.ts";

export const jobsRouter = new Hono();

// GET /api/jobs — last 100 jobs
jobsRouter.get("/", async (c) => {
  const rows = await getJobs();
  return c.json(rows.map(serializeJob));
});

// GET /api/jobs/stream — SSE live updates
jobsRouter.get("/stream", async (c) => {
  c.header("Content-Type", "text/event-stream");
  c.header("Cache-Control", "no-cache");
  c.header("Connection", "keep-alive");
  c.header("X-Accel-Buffering", "no");

  return stream(c, async (s) => {
    // Send current job list on connect
    const jobs = await getJobs();
    await s.write(`data: ${JSON.stringify({ type: "snapshot", jobs: jobs.map(serializeJob) })}\n\n`);

    // Subscribe to updates
    const unsubscribe = subscribeJobUpdates(async (job: JobRow) => {
      try {
        await s.write(`data: ${JSON.stringify({ type: "job_update", job: serializeJob(job) })}\n\n`);
      } catch { /* client disconnected */ }
    });

    // Keep alive ping every 15s
    const pingInterval = setInterval(async () => {
      try {
        await s.write(": ping\n\n");
      } catch {
        clearInterval(pingInterval);
      }
    }, 15_000);

    // Clean up when client disconnects
    await new Promise<void>((resolve) => {
      s.onAbort(() => {
        clearInterval(pingInterval);
        unsubscribe();
        resolve();
      });
    });
  });
});

// GET /api/jobs/:id — single job
jobsRouter.get("/:id", async (c) => {
  const id = c.req.param("id");
  const job = await getJob(id);
  if (!job) throw new JobNotFoundError(id);
  return c.json(serializeJob(job));
});

// DELETE /api/jobs/:id — cancel pending job
jobsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const cancelled = await cancelJob(id);
  if (!cancelled) {
    const job = await getJob(id);
    if (!job) throw new JobNotFoundError(id);
    return c.json({ error: "JOB_NOT_CANCELLABLE", message: `Job is ${job.status}, only pending jobs can be cancelled` }, 409);
  }
  const updated = await getJob(id);
  return c.json(serializeJob(updated!));
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function serializeJob(job: JobRow) {
  return {
    id:         job.id,
    type:       job.type,
    params:     job.params,
    status:     job.status,
    createdAt:  job.createdAt,
    startedAt:  job.startedAt,
    endedAt:    job.endedAt,
    error:      job.error,
    result:     job.result,
    log:        job.log,
  };
}
