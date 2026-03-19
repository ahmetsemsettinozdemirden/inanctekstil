import { useState, useEffect, useMemo } from "react";
import { DesignCard } from "../components/DesignCard.tsx";
import { api, type Design } from "../lib/api.ts";

type TypeFilter   = "ALL" | "TUL" | "FON" | "BLK" | "STN";
type StatusFilter = "ALL" | "ACTIVE" | "DRAFT" | "MISSING";

const TYPE_LABELS: Record<TypeFilter, string> = {
  ALL: "Tümü",
  TUL: "Tül",
  FON: "Fon",
  BLK: "Blackout",
  STN: "Saten",
};

const STATUS_LABELS: Record<StatusFilter, string> = {
  ALL:     "Tümü",
  ACTIVE:  "Aktif",
  DRAFT:   "Taslak",
  MISSING: "Eksik",
};

export function ProductGrid() {
  const [designs, setDesigns]       = useState<Design[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  useEffect(() => {
    api.catalog
      .list()
      .then(setDesigns)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return designs.filter((d) => {
      const matchType =
        typeFilter === "ALL" || d.curtain_type === typeFilter;
      const shopifyStatus = d.shopify.product_id ? d.shopify.status : "MISSING";
      const matchStatus =
        statusFilter === "ALL" || shopifyStatus === statusFilter;
      return matchType && matchStatus;
    });
  }, [designs, typeFilter, statusFilter]);

  if (loading) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Ürün Kataloğu</h1>
        </div>
        <div className="grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="design-card skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error-state">
          <p>Yüklenirken hata oluştu</p>
          <code>{error}</code>
          <button onClick={() => window.location.reload()}>Tekrar dene</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Ürün Kataloğu</h1>
          <p className="page-subtitle">
            {filtered.length} / {designs.length} ürün gösteriliyor
          </p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          {(Object.keys(TYPE_LABELS) as TypeFilter[]).map((t) => (
            <button
              key={t}
              className={`filter-pill ${typeFilter === t ? "active" : ""}`}
              onClick={() => setTypeFilter(t)}
            >
              {TYPE_LABELS[t]}
              {t !== "ALL" && (
                <span className="filter-count">
                  {designs.filter((d) => d.curtain_type === t).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="filter-group">
          {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((s) => (
            <button
              key={s}
              className={`filter-pill ${statusFilter === s ? "active" : ""}`}
              onClick={() => setStatusFilter(s)}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>Seçilen filtrelerle eşleşen ürün bulunamadı.</p>
        </div>
      ) : (
        <div className="grid">
          {filtered.map((design) => (
            <DesignCard key={design.id} design={design} />
          ))}
        </div>
      )}
    </div>
  );
}
