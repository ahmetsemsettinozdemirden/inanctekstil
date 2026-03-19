import { useState, useEffect, useCallback } from "react";
import { JobRow } from "../components/JobRow.tsx";
import { connectJobsStream, type JobData } from "../lib/sse.ts";
import { api, type Room } from "../lib/api.ts";

type StatusFilter = "ALL" | "pending" | "running" | "done" | "failed";

const STATUS_LABELS: Record<StatusFilter, string> = {
  ALL:     "Tümü",
  running: "Çalışıyor",
  pending: "Bekliyor",
  done:    "Tamamlandı",
  failed:  "Hata",
};

export function Jobs() {
  const [jobs, setJobs]               = useState<JobData[]>([]);
  const [filter, setFilter]           = useState<StatusFilter>("ALL");
  const [connected, setConnected]     = useState(false);
  const [rooms, setRooms]             = useState<Room[]>([]);
  const [selectedSku, setSelectedSku] = useState("");
  const [selectedFlow, setSelectedFlow] = useState<"lifestyle" | "texture">("lifestyle");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Upsert job into list
  const upsertJob = useCallback((job: JobData) => {
    setJobs((prev) => {
      const idx = prev.findIndex((j) => j.id === job.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = job;
        return next;
      }
      return [job, ...prev];
    });
  }, []);

  // Connect SSE
  useEffect(() => {
    const disconnect = connectJobsStream(
      (msg) => {
        setConnected(true);
        if (msg.type === "snapshot") {
          setJobs(msg.jobs);
        } else if (msg.type === "job_update") {
          upsertJob(msg.job);
        }
      },
      () => setConnected(false),
    );
    return disconnect;
  }, [upsertJob]);

  // Load rooms for the generate form
  useEffect(() => {
    api.images.rooms().then(setRooms).catch(() => setRooms([]));
  }, []);

  // Filtered jobs
  const filtered = filter === "ALL"
    ? jobs
    : jobs.filter((j) => j.status === filter);

  const counts: Record<StatusFilter, number> = {
    ALL:     jobs.length,
    running: jobs.filter((j) => j.status === "running").length,
    pending: jobs.filter((j) => j.status === "pending").length,
    done:    jobs.filter((j) => j.status === "done").length,
    failed:  jobs.filter((j) => j.status === "failed").length,
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSku.trim()) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await api.images.generate({
        sku:    selectedSku.trim().toUpperCase(),
        flow:   selectedFlow,
        roomId: selectedFlow === "lifestyle" ? selectedRoom : undefined,
      });
      setSelectedSku("");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Bilinmeyen hata");
    }
    setSubmitting(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">İş Kuyruğu</h1>
          <p className="page-subtitle">
            {connected ? (
              <span className="jobs-connected">● Canlı</span>
            ) : (
              <span className="jobs-disconnected">○ Bağlantı kesik</span>
            )}
            {" · "}{jobs.length} iş
          </p>
        </div>
      </div>

      {/* Generate form */}
      <div className="jobs-generate-card">
        <h2 className="jobs-generate-title">Yeni İş Oluştur</h2>
        <form className="jobs-generate-form" onSubmit={handleGenerate}>
          <input
            className="jobs-generate-input"
            placeholder="SKU (ör: TUL-001)"
            value={selectedSku}
            onChange={(e) => setSelectedSku(e.target.value)}
            required
          />
          <select
            className="jobs-generate-select"
            value={selectedFlow}
            onChange={(e) => setSelectedFlow(e.target.value as "lifestyle" | "texture")}
          >
            <option value="lifestyle">Lifestyle</option>
            <option value="texture">Texture</option>
          </select>
          {selectedFlow === "lifestyle" && (
            <select
              className="jobs-generate-select"
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              required
            >
              <option value="">— Oda seç —</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.room_type} ({r.wall_color})
                </option>
              ))}
            </select>
          )}
          <button className="jobs-generate-btn" disabled={submitting} type="submit">
            {submitting ? "Gönderiliyor..." : "Başlat"}
          </button>
        </form>
        {submitError && <p className="jobs-generate-error">{submitError}</p>}
      </div>

      {/* Filter pills */}
      <div className="filter-bar">
        <div className="filter-group">
          {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((s) => (
            <button
              key={s}
              className={`filter-pill ${filter === s ? "active" : ""}`}
              onClick={() => setFilter(s)}
            >
              {STATUS_LABELS[s]}
              <span className="filter-count">{counts[s]}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>İş bulunamadı.</p>
        </div>
      ) : (
        <div className="jobs-list">
          {filtered.map((job) => (
            <JobRow key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
