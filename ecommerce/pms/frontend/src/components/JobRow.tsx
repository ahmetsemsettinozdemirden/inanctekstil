import { useState } from "react";
import { api } from "../lib/api.ts";
import type { JobData } from "../lib/sse.ts";

interface JobRowProps {
  job: JobData;
}

const STATUS_LABELS: Record<string, string> = {
  pending:   "Bekliyor",
  running:   "Çalışıyor",
  done:      "Tamamlandı",
  failed:    "Hata",
  cancelled: "İptal",
};

const TYPE_LABELS: Record<string, string> = {
  lifestyle: "Lifestyle",
  texture:   "Texture",
};

export function JobRow({ job }: JobRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const params = job.params as { sku?: string; roomId?: string };

  const statusClass = {
    pending:   "badge-draft",
    running:   "job-status-running",
    done:      "badge-active",
    failed:    "badge-archived",
    cancelled: "badge-missing",
  }[job.status] ?? "badge-missing";

  const durationMs = job.endedAt && job.startedAt
    ? new Date(job.endedAt).getTime() - new Date(job.startedAt).getTime()
    : job.startedAt
    ? Date.now() - new Date(job.startedAt).getTime()
    : null;

  const duration = durationMs != null
    ? durationMs < 60_000
      ? `${(durationMs / 1000).toFixed(1)}s`
      : `${(durationMs / 60_000).toFixed(1)}m`
    : null;

  const handleCancel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setCancelling(true);
    try {
      await api.jobs.cancel(job.id);
    } catch { /* job state refreshes via SSE */ }
    setCancelling(false);
  };

  return (
    <div className={`job-row ${expanded ? "job-row-expanded" : ""}`} onClick={() => setExpanded(!expanded)}>
      <div className="job-row-main">
        <div className="job-row-left">
          <span className={`badge badge-sm ${statusClass}`}>
            {job.status === "running" && <span className="job-spinner" />}
            {STATUS_LABELS[job.status] ?? job.status}
          </span>
          <span className="job-type">{TYPE_LABELS[job.type] ?? job.type}</span>
          <span className="job-sku">{params.sku}</span>
          {params.roomId && <span className="job-room">{params.roomId}</span>}
        </div>
        <div className="job-row-right">
          {duration && <span className="job-duration">{duration}</span>}
          {job.status === "pending" && (
            <button className="job-cancel-btn" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? "..." : "İptal"}
            </button>
          )}
          <span className="job-chevron">{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div className="job-log">
          {job.error && (
            <div className="job-error">{job.error}</div>
          )}
          {job.log.length > 0 ? (
            <pre className="job-log-content">{job.log.join("\n")}</pre>
          ) : (
            <p className="job-log-empty">
              {job.status === "pending" ? "Kuyruğa alındı, bekleniyor..." : "Log yok."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
