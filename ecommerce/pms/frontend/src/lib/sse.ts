export interface JobData {
  id:        string;
  type:      string;
  params:    Record<string, unknown>;
  status:    "pending" | "running" | "done" | "failed" | "cancelled";
  createdAt: string;
  startedAt: string | null;
  endedAt:   string | null;
  error:     string | null;
  result:    Record<string, unknown> | null;
  log:       string[];
}

export type SSEMessage =
  | { type: "snapshot"; jobs: JobData[] }
  | { type: "job_update"; job: JobData };

export function connectJobsStream(
  onMessage: (msg: SSEMessage) => void,
  onError?: (err: Event) => void,
): () => void {
  const es = new EventSource("/api/jobs/stream");

  es.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data as string) as SSEMessage;
      onMessage(msg);
    } catch { /* ignore malformed */ }
  };

  if (onError) es.onerror = onError;

  return () => es.close();
}
