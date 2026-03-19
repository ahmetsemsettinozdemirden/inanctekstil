import { db } from "../db/client.ts";
import { jobs } from "../db/schema.ts";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "./logger.ts";
import type { JobRow } from "../db/schema.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JobType = "lifestyle" | "texture" | "shopify-sync" | "shopify-image-upload" | "analyze-swatch" | "bulk-generate";

export type JobExecutor = (
  job: JobRow,
  log: (line: string) => Promise<void>,
) => Promise<Record<string, unknown> | void>;

// ---------------------------------------------------------------------------
// In-memory SSE subscribers
// ---------------------------------------------------------------------------

const subscribers = new Set<(job: JobRow) => void>();

export function subscribeJobUpdates(cb: (job: JobRow) => void): () => void {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

function broadcast(job: JobRow): void {
  for (const cb of subscribers) {
    try { cb(job); } catch { /* ignore subscriber errors */ }
  }
}

// ---------------------------------------------------------------------------
// Job CRUD
// ---------------------------------------------------------------------------

export async function enqueueJob(type: JobType, params: Record<string, unknown>): Promise<string> {
  const id = nanoid(8);
  await db.insert(jobs).values({ id, type, params, status: "pending" });
  logger.info({ jobId: id, type, params }, "Job enqueued");
  return id;
}

export async function getJob(id: string): Promise<JobRow | null> {
  const rows = await db.select().from(jobs).where(eq(jobs.id, id));
  return rows[0] ?? null;
}

export async function getJobs(): Promise<JobRow[]> {
  return db.select().from(jobs).orderBy(sql`created_at DESC`).limit(100);
}

export async function cancelJob(id: string): Promise<boolean> {
  const result = await db
    .update(jobs)
    .set({ status: "cancelled", endedAt: sql`now()` })
    .where(sql`id = ${id} AND status = 'pending'`)
    .returning();
  if (result.length > 0) {
    broadcast(result[0]);
    return true;
  }
  return false;
}

async function appendLog(id: string, line: string): Promise<void> {
  await db.execute(sql`UPDATE jobs SET log = array_append(log, ${line}) WHERE id = ${id}`);
  const job = await getJob(id);
  if (job) broadcast(job);
}

// ---------------------------------------------------------------------------
// Worker
// ---------------------------------------------------------------------------

const MAX_CONCURRENT = 2;
const POLL_INTERVAL_MS = 2000;
const executors = new Map<string, JobExecutor>();

export function registerExecutor(type: string, executor: JobExecutor): void {
  executors.set(type, executor);
}

async function getRunningCount(): Promise<number> {
  const result = await db.execute(
    sql`SELECT COUNT(*)::int AS count FROM jobs WHERE status = 'running'`,
  );
  return (result as unknown as Array<{ count: number }>)[0]?.count ?? 0;
}

async function claimNextJob(): Promise<JobRow | null> {
  if ((await getRunningCount()) >= MAX_CONCURRENT) return null;

  const result = await db.execute(sql`
    UPDATE jobs
    SET status = 'running', started_at = now()
    WHERE id = (
      SELECT id FROM jobs
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  `);

  const rows = result as Array<Record<string, unknown>>;
  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    id:        row.id as string,
    type:      row.type as string,
    params:    row.params as Record<string, unknown>,
    status:    row.status as string,
    createdAt: row.created_at as Date,
    startedAt: row.started_at as Date | null,
    endedAt:   row.ended_at as Date | null,
    error:     row.error as string | null,
    result:    row.result as Record<string, unknown> | null,
    log:       (row.log as string[]) ?? [],
  } satisfies JobRow;
}

async function runJob(job: JobRow): Promise<void> {
  logger.info({ jobId: job.id, type: job.type }, "Job starting");

  const executor = executors.get(job.type);
  if (!executor) {
    await db.update(jobs)
      .set({ status: "failed", error: `No executor registered for type: ${job.type}`, endedAt: sql`now()` })
      .where(eq(jobs.id, job.id));
    const updated = await getJob(job.id);
    if (updated) broadcast(updated);
    return;
  }

  const log = (line: string) => appendLog(job.id, line);

  try {
    const result = await executor(job, log);
    await db.update(jobs)
      .set({
        status: "done",
        endedAt: sql`now()`,
        ...(result ? { result } : {}),
      })
      .where(eq(jobs.id, job.id));
    const updated = await getJob(job.id);
    if (updated) broadcast(updated);
    logger.info({ jobId: job.id, type: job.type }, "Job completed");
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    await db.update(jobs)
      .set({ status: "failed", error: errMsg, endedAt: sql`now()` })
      .where(eq(jobs.id, job.id));
    const updated = await getJob(job.id);
    if (updated) broadcast(updated);
    logger.error({ jobId: job.id, type: job.type, err }, "Job failed");
  }
}

let workerStarted = false;

export function startWorker(): void {
  if (workerStarted) return;
  workerStarted = true;

  async function tick(): Promise<void> {
    try {
      const job = await claimNextJob();
      if (job) {
        // fire-and-forget to allow concurrency
        runJob(job).catch(err => logger.error({ err }, "Job runner error"));
      }
    } catch (err) {
      logger.error({ err }, "Worker tick error");
    }
    setTimeout(tick, POLL_INTERVAL_MS);
  }

  tick();
  logger.info({ pollIntervalMs: POLL_INTERVAL_MS, maxConcurrent: MAX_CONCURRENT }, "Job worker started");
}
