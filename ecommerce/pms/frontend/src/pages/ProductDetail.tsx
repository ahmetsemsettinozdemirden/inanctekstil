import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api, type Design, type Room, type GeneratedImage, type UpdateDesignPayload } from "../lib/api.ts";
import { StatusBadge, TypeBadge } from "../components/StatusBadge.tsx";
import { swatchUrl, generatedImageUrl } from "../lib/api.ts";

// Map SKU → { lifestyle: GeneratedImage[], texture: GeneratedImage | null }
type ImagesBySkuMap = Record<string, { lifestyle: GeneratedImage[]; texture: GeneratedImage | null }>;

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [design, setDesign]         = useState<Design | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [syncMsg, setSyncMsg]       = useState<string | null>(null);
  const [syncing, setSyncing]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rooms, setRooms]           = useState<Room[]>([]);
  const [genFlow, setGenFlow]       = useState<"lifestyle" | "texture">("lifestyle");
  const [genRoom, setGenRoom]       = useState("");
  const [genSku, setGenSku]         = useState("");
  const [genError, setGenError]     = useState<string | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [imagesBySku, setImagesBySku]     = useState<ImagesBySkuMap>({});
  const [uploadingSkus, setUploadingSkus] = useState<Set<string>>(new Set());
  const [analyzingSkus, setAnalyzingSkus] = useState<Set<string>>(new Set());
  const [bulkGenLoading, setBulkGenLoading] = useState(false);
  const [editMode, setEditMode]           = useState(false);
  const [editDraft, setEditDraft]         = useState<UpdateDesignPayload>({});
  const [editSaving, setEditSaving]       = useState(false);

  const loadImages = useCallback(async (skus: string[]) => {
    const entries = await Promise.all(
      skus.map(async (sku) => {
        try {
          const data = await api.images.bySku(sku);
          return [sku, data] as const;
        } catch {
          return [sku, { lifestyle: [], texture: null }] as const;
        }
      }),
    );
    setImagesBySku(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    if (!id) return;
    api.catalog.get(id)
      .then((d) => {
        setDesign(d);
        loadImages(d.variants.map((v) => v.sku));
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
    api.images.rooms().then(setRooms).catch(() => {});
  }, [id, loadImages]);

  const shopifyStatus = design
    ? design.shopify.product_id ? design.shopify.status : "MISSING"
    : null;

  const handleRefresh = async () => {
    if (!id) return;
    setRefreshing(true);
    setSyncMsg(null);
    try {
      await api.shopify.refreshAll();
      const updated = await api.catalog.get(id);
      setDesign(updated);
      setSyncMsg("Shopify'dan durum güncellendi.");
    } catch (err) {
      setSyncMsg(`Hata: ${err instanceof Error ? err.message : String(err)}`);
    }
    setRefreshing(false);
  };

  const handleSync = async () => {
    if (!id) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const { jobId } = await api.shopify.sync(id);
      setSyncMsg(`Senkronizasyon başlatıldı (iş: ${jobId})`);
    } catch (err) {
      setSyncMsg(`Hata: ${err instanceof Error ? err.message : String(err)}`);
    }
    setSyncing(false);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genSku) return;
    setGenError(null);
    setGenLoading(true);
    try {
      await api.images.generate({
        sku:    genSku,
        flow:   genFlow,
        roomId: genFlow === "lifestyle" ? genRoom : undefined,
      });
      setSyncMsg(`Görsel üretimi başlatıldı (${genSku})`);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : String(err));
    }
    setGenLoading(false);
  };

  const handleAnalyzeSwatch = async (sku: string) => {
    setAnalyzingSkus((prev) => new Set(prev).add(sku));
    setSyncMsg(null);
    try {
      const { jobId } = await api.images.analyze(sku);
      setSyncMsg(`Kumaş analizi başlatıldı: ${sku} (iş: ${jobId})`);
    } catch (err) {
      setSyncMsg(`Hata (${sku}): ${err instanceof Error ? err.message : String(err)}`);
    }
    setAnalyzingSkus((prev) => { const s = new Set(prev); s.delete(sku); return s; });
  };

  const handleBulkGenerate = async () => {
    if (!id) return;
    setBulkGenLoading(true);
    setSyncMsg(null);
    try {
      const { jobId } = await api.images.generateBulk(id);
      setSyncMsg(`Toplu görsel üretimi başlatıldı (iş: ${jobId})`);
    } catch (err) {
      setSyncMsg(`Hata: ${err instanceof Error ? err.message : String(err)}`);
    }
    setBulkGenLoading(false);
  };

  const handleSaveEdit = async () => {
    if (!id || Object.keys(editDraft).length === 0) { setEditMode(false); return; }
    setEditSaving(true);
    try {
      const updated = await api.catalog.update(id, editDraft);
      setDesign(updated);
      setEditMode(false);
      setEditDraft({});
      setSyncMsg("Değişiklikler kaydedildi.");
    } catch (err) {
      setSyncMsg(`Hata: ${err instanceof Error ? err.message : String(err)}`);
    }
    setEditSaving(false);
  };

  const handleUploadImages = async (sku: string) => {
    setUploadingSkus((prev) => new Set(prev).add(sku));
    setSyncMsg(null);
    try {
      const result = await api.shopify.uploadImages(sku);
      if ("jobId" in result) {
        setSyncMsg(`Görsel yükleme başlatıldı: ${sku} (iş: ${result.jobId}, ${result.pending} görsel)`);
      } else {
        setSyncMsg("Tüm görseller zaten yüklü.");
      }
    } catch (err) {
      setSyncMsg(`Hata (${sku}): ${err instanceof Error ? err.message : String(err)}`);
    }
    setUploadingSkus((prev) => { const s = new Set(prev); s.delete(sku); return s; });
  };

  if (loading) {
    return (
      <div className="page">
        <Link to="/" className="back-link">← Ürünler</Link>
        <div className="detail-skeleton" />
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="page">
        <Link to="/" className="back-link">← Ürünler</Link>
        <div className="error-state">
          <p>Yüklenirken hata oluştu</p>
          <code>{error ?? "Ürün bulunamadı"}</code>
          <button onClick={() => navigate("/")}>Geri dön</button>
        </div>
      </div>
    );
  }

  // Collect all generated images across all variants
  const allImages: Array<{ sku: string; img: GeneratedImage }> = [];
  for (const v of design.variants) {
    const data = imagesBySku[v.sku];
    if (!data) continue;
    for (const img of data.lifestyle) allImages.push({ sku: v.sku, img });
    if (data.texture) allImages.push({ sku: v.sku, img: data.texture });
  }

  return (
    <div className="page">
      <Link to="/" className="back-link">← Ürünler</Link>

      <div className="page-header">
        <div>
          <h1 className="page-title">{design.design}</h1>
          <p className="page-subtitle">{design.id} · {design.width_cm} cm en · {design.price} TL/m</p>
        </div>
        <div className="detail-badges">
          <TypeBadge type={design.curtain_type} />
          {shopifyStatus && <StatusBadge status={shopifyStatus} />}
        </div>
      </div>

      {syncMsg && (
        <div className={`detail-msg ${syncMsg.startsWith("Hata") ? "detail-msg-error" : "detail-msg-ok"}`}>
          {syncMsg}
        </div>
      )}

      {/* Generated images gallery */}
      {allImages.length > 0 && (
        <div className="detail-gallery">
          <h2 className="detail-section-title">
            Üretilen Görseller ({allImages.length})
          </h2>
          <div className="gallery-grid">
            {allImages.map(({ sku, img }) => {
              const filename = img.filePath.split("/").pop()!;
              const typeDir = img.filePath.split("/")[1];
              return (
                <div key={img.id} className="gallery-item">
                  <div className="gallery-img-wrap">
                    <img
                      src={generatedImageUrl(typeDir, sku, filename)}
                      alt={filename}
                      className="gallery-img"
                      loading="lazy"
                    />
                    {img.shopifyMediaId && (
                      <span className="gallery-uploaded-badge">✓ Yüklendi</span>
                    )}
                  </div>
                  <div className="gallery-item-meta">
                    <span className="gallery-sku">{sku}</span>
                    <span className="gallery-type">{img.imageType}{img.roomId ? ` · ${img.roomId.replace("room-", "").replace(/-/g, " ")}` : ""}</span>
                    {img.evaluationScore && (
                      <span className="gallery-score">★ {img.evaluationScore}/10</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="detail-layout">
        {/* Left column */}
        <div>
          {/* Variants */}
          <div className="detail-variants">
            <h2 className="detail-section-title">Renkler ({design.variants.length})</h2>
            <div className="variant-list">
              {design.variants.map((v) => {
                const imgs = imagesBySku[v.sku];
                const imgCount = (imgs?.lifestyle.length ?? 0) + (imgs?.texture ? 1 : 0);
                const uploadedCount = [
                  ...(imgs?.lifestyle ?? []),
                  ...(imgs?.texture ? [imgs.texture] : []),
                ].filter((i) => i.shopifyMediaId).length;

                return (
                  <div key={v.sku} className="variant-row">
                    <div className="variant-swatch-wrap">
                      {v.swatch ? (
                        <img src={swatchUrl(v.swatch)} alt={v.colour} className="variant-swatch-img" />
                      ) : (
                        <div className="variant-swatch-empty" />
                      )}
                    </div>
                    <div className="variant-info">
                      <span className="variant-sku">{v.sku}</span>
                      <span className="variant-colour">{v.colour}</span>
                      {v.finish && <span className="variant-finish">{v.finish}</span>}
                    </div>
                    <div className="variant-row-right">
                      <StatusBadge status={v.shopify.variant_id ? v.shopify.status : "MISSING"} size="sm" />
                      {imgCount > 0 && (
                        <span className="variant-img-count">
                          {uploadedCount}/{imgCount} görsel
                        </span>
                      )}
                      {imgCount > 0 && uploadedCount < imgCount && design.shopify.product_id && (
                        <button
                          className="variant-upload-btn"
                          onClick={() => handleUploadImages(v.sku)}
                          disabled={uploadingSkus.has(v.sku)}
                        >
                          {uploadingSkus.has(v.sku) ? "..." : "↑ Yükle"}
                        </button>
                      )}
                      {v.swatch && (
                        <button
                          className="variant-upload-btn"
                          onClick={() => handleAnalyzeSwatch(v.sku)}
                          disabled={analyzingSkus.has(v.sku)}
                          title="Kumaşı BAML ile analiz et"
                        >
                          {analyzingSkus.has(v.sku) ? "..." : "⚗ Analiz"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right: actions panel */}
        <div className="detail-actions">

          {/* Shopify sync */}
          <div className="detail-card">
            <h3 className="detail-card-title">Shopify Senkronizasyonu</h3>
            {design.shopify.product_id ? (
              <div className="detail-shopify-info">
                <a
                  href={`https://1z7hb1-2d.myshopify.com/admin/products/${design.shopify.product_id.split("/").pop()}`}
                  target="_blank"
                  rel="noreferrer"
                  className="detail-shopify-link"
                >
                  Shopify'da görüntüle ↗
                </a>
                <span className="detail-shopify-handle">/{design.shopify.handle}</span>
              </div>
            ) : (
              <p className="detail-card-hint">Shopify'da henüz ürün oluşturulmamış.</p>
            )}
            <div className="detail-shopify-actions">
              <button className="btn-primary" onClick={handleSync} disabled={syncing}>
                {syncing ? "Senkronize ediliyor..." : design.shopify.product_id ? "Yeniden senkronize et" : "Shopify'a aktar"}
              </button>
              {design.shopify.product_id && (
                <button className="btn-secondary" onClick={handleRefresh} disabled={refreshing}>
                  {refreshing ? "Yenileniyor..." : "↻ Shopify'dan Yenile"}
                </button>
              )}
            </div>
          </div>

          {/* Image generation */}
          <div className="detail-card">
            <h3 className="detail-card-title">Görsel Üret</h3>
            <form onSubmit={handleGenerate} className="detail-gen-form">
              <select
                className="jobs-generate-select"
                value={genSku}
                onChange={(e) => setGenSku(e.target.value)}
                required
              >
                <option value="">— SKU seç —</option>
                {design.variants.map((v) => (
                  <option key={v.sku} value={v.sku}>{v.sku} — {v.colour}</option>
                ))}
              </select>
              <select
                className="jobs-generate-select"
                value={genFlow}
                onChange={(e) => setGenFlow(e.target.value as "lifestyle" | "texture")}
              >
                <option value="lifestyle">Lifestyle</option>
                <option value="texture">Texture</option>
              </select>
              {genFlow === "lifestyle" && (
                <select
                  className="jobs-generate-select"
                  value={genRoom}
                  onChange={(e) => setGenRoom(e.target.value)}
                  required
                >
                  <option value="">— Oda seç —</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>{r.room_type} ({r.wall_color})</option>
                  ))}
                </select>
              )}
              {genError && <p className="detail-gen-error">{genError}</p>}
              <button className="btn-primary" disabled={genLoading} type="submit">
                {genLoading ? "Gönderiliyor..." : "Görsel üret"}
              </button>
            </form>
          </div>

          {/* Bulk generate */}
          <div className="detail-card">
            <h3 className="detail-card-title">Toplu Görsel Üret</h3>
            <p className="detail-card-hint">Tüm renk ve odalar için eksik görselleri kuyruğa ekler.</p>
            <button className="btn-secondary" onClick={handleBulkGenerate} disabled={bulkGenLoading}>
              {bulkGenLoading ? "Kuyruğa ekleniyor..." : "Tüm Eksikleri Üret"}
            </button>
          </div>

          {/* Fabric info / edit */}
          <div className="detail-card">
            <div className="detail-card-header">
              <h3 className="detail-card-title">Kumaş Bilgisi</h3>
              <button
                className="btn-ghost"
                onClick={() => {
                  if (editMode) { setEditMode(false); setEditDraft({}); }
                  else { setEditMode(true); setEditDraft({ price: design.price, composition: design.composition ?? undefined, fabric: { ...design.fabric } }); }
                }}
              >
                {editMode ? "İptal" : "Düzenle"}
              </button>
            </div>

            {editMode ? (
              <div className="detail-edit-form">
                <label className="detail-edit-label">
                  Fiyat (TL/m)
                  <input
                    type="number"
                    className="detail-edit-input"
                    value={editDraft.price ?? ""}
                    onChange={(e) => setEditDraft((d) => ({ ...d, price: Number(e.target.value) }))}
                  />
                </label>
                <label className="detail-edit-label">
                  Kompozisyon
                  <input
                    type="text"
                    className="detail-edit-input"
                    value={editDraft.composition ?? ""}
                    onChange={(e) => setEditDraft((d) => ({ ...d, composition: e.target.value || null }))}
                  />
                </label>
                <label className="detail-edit-label">
                  Materyal
                  <input
                    type="text"
                    className="detail-edit-input"
                    value={editDraft.fabric?.material ?? ""}
                    onChange={(e) => setEditDraft((d) => ({ ...d, fabric: { ...d.fabric, material: e.target.value || null } }))}
                  />
                </label>
                <label className="detail-edit-label">
                  Şeffaflık
                  <input
                    type="text"
                    className="detail-edit-input"
                    value={editDraft.fabric?.transparency ?? ""}
                    onChange={(e) => setEditDraft((d) => ({ ...d, fabric: { ...d.fabric, transparency: e.target.value || null } }))}
                  />
                </label>
                <label className="detail-edit-label">
                  Gramaj
                  <input
                    type="text"
                    className="detail-edit-input"
                    value={editDraft.fabric?.weight ?? ""}
                    onChange={(e) => setEditDraft((d) => ({ ...d, fabric: { ...d.fabric, weight: e.target.value || null } }))}
                  />
                </label>
                <label className="detail-edit-label">
                  Doku
                  <input
                    type="text"
                    className="detail-edit-input"
                    value={editDraft.fabric?.texture ?? ""}
                    onChange={(e) => setEditDraft((d) => ({ ...d, fabric: { ...d.fabric, texture: e.target.value || null } }))}
                  />
                </label>
                <label className="detail-edit-label">
                  Desen
                  <input
                    type="text"
                    className="detail-edit-input"
                    value={editDraft.fabric?.pattern ?? ""}
                    onChange={(e) => setEditDraft((d) => ({ ...d, fabric: { ...d.fabric, pattern: e.target.value || null } }))}
                  />
                </label>
                <button className="btn-primary" onClick={handleSaveEdit} disabled={editSaving}>
                  {editSaving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            ) : (
              <dl className="detail-fabric">
                {design.composition && <><dt>Kompozisyon</dt><dd>{design.composition}</dd></>}
                {design.fabric.material     && <><dt>Materyal</dt><dd>{design.fabric.material}</dd></>}
                {design.fabric.transparency && <><dt>Şeffaflık</dt><dd>{design.fabric.transparency}</dd></>}
                {design.fabric.weight       && <><dt>Gramaj</dt><dd>{design.fabric.weight}</dd></>}
                {design.fabric.texture      && <><dt>Doku</dt><dd>{design.fabric.texture}</dd></>}
                {design.fabric.pattern      && <><dt>Desen</dt><dd>{design.fabric.pattern}</dd></>}
              </dl>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
