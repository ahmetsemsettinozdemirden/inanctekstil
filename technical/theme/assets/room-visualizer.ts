// Odanda Gör — AI Room Visualizer Modal
// Compiled via esbuild to IIFE

interface RoomVisualizerConfig {
  productId?: string;
  productHandle?: string;
  productTitle?: string;
  productType?: string;
  productColor?: string;
  productImageUrl?: string;
  productSku?: string;
  apiUrl: string;
  dataProductsJson?: string;
}

interface CurtainProduct {
  id: string;
  handle: string;
  title: string;
  imageUrl: string;
  type: string;
  color?: string;
  sku?: string;
}

type ModalState = "upload" | "picker" | "loading" | "result" | "error";

const TYPE_LABELS: Record<string, string> = {
  FON: "Fon",
  BLK: "Blackout",
  STN: "Saten",
  TUL: "Tül",
};

function typeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

const STYLES = `
  #rv-overlay {
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(10,15,25,0.72);
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-body--family, Inter, sans-serif);
    padding: 16px;
  }
  #rv-modal {
    background: #fff;
    border-radius: 10px;
    width: min(620px, 100%);
    max-height: 92vh;
    overflow-y: auto;
    position: relative;
    box-shadow: 0 32px 80px rgba(0,0,0,0.28);
    display: flex; flex-direction: column;
  }
  #rv-modal-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 20px 16px;
    border-bottom: 1px solid #efefef;
    position: sticky; top: 0; background: #fff; z-index: 2;
    border-radius: 10px 10px 0 0;
  }
  .rv-head-title {
    font-size: 15px; font-weight: 600; color: #1B2A4A;
    letter-spacing: 0.01em;
  }
  #rv-close {
    background: none; border: none; cursor: pointer;
    width: 28px; height: 28px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: #666; transition: background 0.15s;
    flex-shrink: 0; padding: 0;
  }
  #rv-close:hover { background: #f2f2f2; color: #111; }
  #rv-close svg { display: block; }
  .rv-body { padding: 20px; flex: 1; }

  /* — Product picker — */
  .rv-picker-hint {
    font-size: 13px; color: #888; margin: 0 0 16px;
  }
  .rv-products-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  @media (max-width: 420px) {
    .rv-products-grid { grid-template-columns: repeat(2, 1fr); }
  }
  .rv-product-card {
    border-radius: 8px; overflow: hidden; cursor: pointer;
    position: relative;
    border: 2px solid transparent;
    background: #f9f8f7;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .rv-product-card:hover {
    border-color: #1B2A4A;
    box-shadow: 0 4px 14px rgba(27,42,74,0.12);
  }
  .rv-product-card.selected {
    border-color: #1B2A4A;
    box-shadow: 0 0 0 3px rgba(27,42,74,0.12);
  }
  .rv-product-card.selected::after {
    content: '✓';
    position: absolute; top: 7px; right: 7px;
    width: 20px; height: 20px;
    background: #1B2A4A; color: #fff;
    border-radius: 50%; font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    line-height: 1;
  }
  .rv-product-card img {
    width: 100%; aspect-ratio: 3/4; object-fit: cover; display: block;
  }
  .rv-card-info { padding: 8px 8px 9px; }
  .rv-card-type {
    font-size: 10px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.06em; color: #999; margin-bottom: 2px;
  }
  .rv-card-title {
    font-size: 12px; color: #1B2A4A; font-weight: 600;
    line-height: 1.3;
  }

  /* — Upload — */
  .rv-selected-product {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; background: #f5f3f0;
    border-radius: 7px; margin-bottom: 16px;
  }
  .rv-selected-product img {
    width: 38px; height: 50px; object-fit: cover;
    border-radius: 4px; flex-shrink: 0;
  }
  .rv-selected-product-info { flex: 1; min-width: 0; }
  .rv-selected-product-label {
    font-size: 10px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.06em; color: #999; margin-bottom: 1px;
  }
  .rv-selected-product-name {
    font-size: 13px; font-weight: 600; color: #1B2A4A;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  #rv-change-product {
    background: none; border: none; cursor: pointer;
    font-size: 12px; color: #888; text-decoration: underline;
    padding: 0; white-space: nowrap; flex-shrink: 0;
  }
  #rv-change-product:hover { color: #1B2A4A; }
  .rv-dropzone {
    background: #f7f6f4;
    border-radius: 8px;
    padding: 36px 24px;
    text-align: center; cursor: pointer;
    transition: background 0.15s;
    display: block; width: 100%; box-sizing: border-box;
    border: none;
  }
  .rv-dropzone:hover, .rv-dropzone.rv-dragover {
    background: #eeece8;
  }
  .rv-dropzone-icon {
    display: flex; align-items: center; justify-content: center;
    width: 44px; height: 44px; border-radius: 10px;
    background: #fff; margin: 0 auto 12px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.1);
  }
  .rv-dropzone-title {
    font-size: 14px; font-weight: 600; color: #1B2A4A; margin: 0 0 4px;
  }
  .rv-dropzone-sub {
    font-size: 12px; color: #999; margin: 0;
  }
  .rv-error-msg { color: #b00; font-size: 13px; margin-top: 10px; }

  /* — Loading — */
  .rv-loading-wrap {
    display: flex; flex-direction: column; align-items: center;
    gap: 0;
  }
  .rv-loading-preview {
    position: relative; width: 100%; border-radius: 8px; overflow: hidden;
    background: #f0f0f0;
  }
  .rv-loading-img {
    width: 100%; max-height: 280px; object-fit: cover;
    display: block; opacity: 0.55;
  }
  .rv-loading-overlay {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 12px;
  }
  .rv-spinner {
    width: 36px; height: 36px;
    border: 3px solid rgba(255,255,255,0.35);
    border-top-color: #fff;
    border-radius: 50%;
    animation: rv-spin 0.75s linear infinite;
  }
  .rv-loading-label {
    font-size: 13px; font-weight: 500; color: #fff;
    background: rgba(0,0,0,0.45); padding: 5px 12px;
    border-radius: 20px; letter-spacing: 0.01em;
  }
  .rv-loading-no-preview {
    padding: 56px 0;
    display: flex; flex-direction: column; align-items: center; gap: 14px;
  }
  .rv-spinner-dark {
    width: 36px; height: 36px;
    border: 3px solid #e5e5e5;
    border-top-color: #1B2A4A;
    border-radius: 50%;
    animation: rv-spin 0.75s linear infinite;
  }
  .rv-loading-text-dark {
    font-size: 14px; color: #444;
  }
  @keyframes rv-spin { to { transform: rotate(360deg); } }

  /* — Result — */
  .rv-result-img { width: 100%; border-radius: 8px; display: block; }
  .rv-result-meta {
    display: flex; align-items: center; justify-content: space-between;
    margin: 12px 0 14px;
  }
  .rv-result-name { font-size: 14px; font-weight: 600; color: #1B2A4A; }
  #rv-try-again {
    background: none; border: none; cursor: pointer;
    font-size: 12px; color: #999; text-decoration: underline; padding: 0;
  }
  #rv-try-again:hover { color: #1B2A4A; }
  .rv-btns { display: flex; gap: 8px; }
  .rv-btn-primary {
    flex: 1; padding: 12px 16px; border-radius: 7px;
    background: #1B2A4A; color: #fff;
    font-size: 14px; font-weight: 600; cursor: pointer; border: none;
    font-family: inherit;
    transition: background 0.15s;
  }
  .rv-btn-primary:hover { background: #263d6b; }
  .rv-btn-secondary {
    padding: 12px 16px; border-radius: 7px;
    background: transparent; color: #1B2A4A;
    border: 1.5px solid #1B2A4A;
    font-size: 14px; font-weight: 600; cursor: pointer;
    font-family: inherit;
    transition: background 0.15s;
    white-space: nowrap;
  }
  .rv-btn-secondary:hover { background: #f5f3f0; }

  /* — Error — */
  .rv-error-wrap { text-align: center; padding: 32px 0 16px; }
  .rv-error-icon { font-size: 40px; margin-bottom: 10px; }
  .rv-error-text { color: #444; font-size: 14px; margin-bottom: 16px; line-height: 1.5; }
`;

function injectStyles(): void {
  if (document.getElementById("rv-styles")) return;
  const style = document.createElement("style");
  style.id = "rv-styles";
  style.textContent = STYLES;
  document.head.appendChild(style);
}

let modalEl: HTMLElement | null = null;
let currentConfig: RoomVisualizerConfig | null = null;
let currentState: ModalState = "upload";
let uploadedFile: File | null = null;
let selectedProduct: CurtainProduct | null = null;
let resultBlobUrl: string | null = null;

function openModal(): void {
  if (!modalEl) return;
  modalEl.style.display = "flex";
}

function closeModal(): void {
  if (!modalEl) return;
  modalEl.style.display = "none";
  if (resultBlobUrl) {
    URL.revokeObjectURL(resultBlobUrl);
    resultBlobUrl = null;
  }
}

function renderUploadState(body: HTMLElement): void {
  const isLandingFlow = !currentConfig?.productId;
  const showProductChip = !!selectedProduct;

  const productChip = showProductChip && selectedProduct ? `
    <div class="rv-selected-product">
      <img src="${selectedProduct.imageUrl}" alt="${selectedProduct.title}" />
      <div class="rv-selected-product-info">
        <div class="rv-selected-product-label">${typeLabel(selectedProduct.type)}</div>
        <div class="rv-selected-product-name">${selectedProduct.title}</div>
      </div>
      ${isLandingFlow ? `<button id="rv-change-product">Değiştir</button>` : ""}
    </div>
  ` : "";

  body.innerHTML = `
    ${productChip}
    <button id="rv-dropzone" class="rv-dropzone" type="button">
      <div class="rv-dropzone-icon">
        <svg width="20" height="20" fill="none" stroke="#1B2A4A" stroke-width="2" viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>
      <p class="rv-dropzone-title">Oda fotoğrafınızı yükleyin</p>
      <p class="rv-dropzone-sub">JPG, PNG veya WEBP · maks. 10MB</p>
    </button>
    <input id="rv-file-input" type="file" accept="image/jpeg,image/png,image/webp"
      style="display:none" tabindex="-1" />
    <div id="rv-upload-error" class="rv-error-msg" style="display:none"></div>
  `;

  const fileInput = body.querySelector<HTMLInputElement>("#rv-file-input");
  const dropzone = body.querySelector<HTMLElement>("#rv-dropzone");
  const errorEl = body.querySelector<HTMLElement>("#rv-upload-error");

  function handleFile(file: File): void {
    const err = validateFile(file);
    if (err) {
      if (errorEl) { errorEl.textContent = err; errorEl.style.display = "block"; }
      return;
    }
    uploadedFile = file;
    proceedFromUpload();
  }

  dropzone?.addEventListener("click", () => fileInput?.click());
  dropzone?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInput?.click(); }
  });
  dropzone?.addEventListener("dragover", (e) => {
    e.preventDefault(); dropzone.classList.add("rv-dragover");
  });
  dropzone?.addEventListener("dragleave", () => dropzone.classList.remove("rv-dragover"));
  dropzone?.addEventListener("drop", (e) => {
    e.preventDefault(); dropzone.classList.remove("rv-dragover");
    const file = e.dataTransfer?.files[0];
    if (file) handleFile(file);
  });

  fileInput?.addEventListener("change", () => {
    if (fileInput.files?.[0]) handleFile(fileInput.files[0]);
  });

  body.querySelector<HTMLButtonElement>("#rv-change-product")?.addEventListener("click", (e) => {
    e.stopPropagation();
    selectedProduct = null;
    setState("picker");
  });
}

function validateFile(file: File): string | null {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) return "Geçersiz format. Lütfen JPG, PNG veya WEBP yükleyin.";
  if (file.size > 10 * 1024 * 1024) return "Dosya 10MB'den büyük olamaz.";
  return null;
}

function proceedFromUpload(): void {
  if (!currentConfig) return;
  if (selectedProduct) {
    setState("loading");
    runVisualization();
  } else if (currentConfig.productId) {
    selectedProduct = {
      id: currentConfig.productId,
      handle: currentConfig.productHandle ?? "",
      title: currentConfig.productTitle ?? "",
      type: currentConfig.productType ?? "",
      color: currentConfig.productColor ?? "",
      imageUrl: currentConfig.productImageUrl ?? "",
      sku: currentConfig.productSku ?? "",
    };
    setState("loading");
    runVisualization();
  } else {
    setState("picker");
  }
}

function renderPickerState(body: HTMLElement): void {
  const products: CurtainProduct[] = currentConfig?.dataProductsJson
    ? (JSON.parse(currentConfig.dataProductsJson) as CurtainProduct[])
    : [];

  const cards = products.map((p) => `
    <div class="rv-product-card"
      data-id="${p.id}" data-handle="${p.handle}"
      data-title="${p.title}" data-type="${p.type}"
      data-color="${p.color ?? ""}" data-image-url="${p.imageUrl}"
      data-sku="${p.sku ?? ""}"
      tabindex="0" role="button" aria-label="${p.title}">
      <img src="${p.imageUrl}" alt="${p.title}" loading="lazy" />
      <div class="rv-card-info">
        <div class="rv-card-type">${typeLabel(p.type)}</div>
        <div class="rv-card-title">${p.title}</div>
      </div>
    </div>
  `).join("");

  body.innerHTML = `
    <p class="rv-picker-hint">Odanıza eklemek istediğiniz perdeyi seçin.</p>
    <div class="rv-products-grid">
      ${cards || "<p>Ürün bulunamadı.</p>"}
    </div>
  `;

  body.querySelectorAll<HTMLElement>(".rv-product-card").forEach((card) => {
    function select(): void {
      body.querySelectorAll(".rv-product-card").forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      selectedProduct = {
        id: card.dataset["id"]!,
        handle: card.dataset["handle"]!,
        title: card.dataset["title"] ?? "",
        type: card.dataset["type"] ?? "",
        color: card.dataset["color"] ?? "",
        imageUrl: card.dataset["imageUrl"] ?? "",
        sku: card.dataset["sku"] ?? "",
      };
      setTimeout(() => {
        if (uploadedFile) {
          setState("loading");
          runVisualization();
        } else {
          setState("upload");
        }
      }, 220);
    }
    card.addEventListener("click", select);
    card.addEventListener("keydown", (e) => { if (e.key === "Enter") select(); });
  });
}

function renderLoadingState(body: HTMLElement): void {
  const previewUrl = uploadedFile ? URL.createObjectURL(uploadedFile) : "";
  if (previewUrl) {
    body.innerHTML = `
      <div class="rv-loading-wrap">
        <div class="rv-loading-preview">
          <img class="rv-loading-img" src="${previewUrl}" alt="Oda fotoğrafı" />
          <div class="rv-loading-overlay">
            <div class="rv-spinner"></div>
            <span class="rv-loading-label">Yapay zeka hazırlıyor…</span>
          </div>
        </div>
      </div>
    `;
  } else {
    body.innerHTML = `
      <div class="rv-loading-no-preview">
        <div class="rv-spinner-dark"></div>
        <p class="rv-loading-text-dark">Yapay zeka hazırlıyor…</p>
      </div>
    `;
  }
}

function renderResultState(body: HTMLElement, blobUrl: string, productTitle: string): void {
  const fromProductPage = !!currentConfig?.productId;
  const handle = selectedProduct?.handle ?? "";

  body.innerHTML = `
    <img class="rv-result-img" src="${blobUrl}" alt="AI ile oluşturulmuş oda görseli" />
    <div class="rv-result-meta">
      <span class="rv-result-name">${productTitle}</span>
      <button id="rv-try-again">Tekrar dene</button>
    </div>
    <div class="rv-btns">
      <button class="rv-btn-primary" id="rv-order-btn">Sipariş Ver</button>
      <button class="rv-btn-secondary" id="rv-save-btn">Kaydet</button>
    </div>
  `;

  body.querySelector<HTMLButtonElement>("#rv-order-btn")?.addEventListener("click", () => {
    closeModal();
    if (fromProductPage) {
      const configurator = document.querySelector<HTMLElement>(
        "[data-section-type='curtain-configurator'], #curtain-configurator, .curtain-configurator"
      );
      if (configurator) configurator.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = `/${handle}`;
    }
  });

  const saveBtn = body.querySelector<HTMLButtonElement>("#rv-save-btn");
  if (saveBtn) {
    if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
      saveBtn.addEventListener("click", async () => {
        try {
          const res = await fetch(blobUrl);
          const blob = await res.blob();
          const file = new File([blob], "odanda-gor.jpg", { type: "image/jpeg" });
          await navigator.share({ files: [file], title: productTitle });
        } catch {
          downloadImage(blobUrl);
        }
      });
    } else {
      saveBtn.addEventListener("click", () => downloadImage(blobUrl));
    }
  }

  body.querySelector<HTMLButtonElement>("#rv-try-again")?.addEventListener("click", () => {
    uploadedFile = null;
    selectedProduct = null;
    setState(currentConfig?.productId ? "upload" : "picker");
  });
}

function downloadImage(blobUrl: string): void {
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = "odanda-gor.jpg";
  a.click();
}

function renderErrorState(body: HTMLElement): void {
  body.innerHTML = `
    <div class="rv-error-wrap">
      <div class="rv-error-icon">⚠️</div>
      <p class="rv-error-text">Görsel oluşturulamadı. Lütfen farklı bir fotoğraf deneyin.</p>
      <button class="rv-btn-primary" id="rv-retry-btn">Tekrar Dene</button>
    </div>
  `;
  body.querySelector<HTMLButtonElement>("#rv-retry-btn")?.addEventListener("click", () => {
    uploadedFile = null;
    selectedProduct = null;
    setState(currentConfig?.productId ? "upload" : "picker");
  });
}

const STATE_TITLES: Record<ModalState, string> = {
  upload: "Oda Fotoğrafı",
  picker: "Perde Seçin",
  loading: "Hazırlanıyor",
  result: "Sonuç",
  error: "Hata",
};

function setState(state: ModalState): void {
  currentState = state;
  if (!modalEl) return;

  const titleEl = modalEl.querySelector<HTMLElement>(".rv-head-title");
  const body = modalEl.querySelector<HTMLElement>(".rv-body");
  if (!body) return;

  if (titleEl) titleEl.textContent = STATE_TITLES[state];

  if (state === "upload") renderUploadState(body);
  else if (state === "picker") renderPickerState(body);
  else if (state === "loading") renderLoadingState(body);
  else if (state === "error") renderErrorState(body);
}

async function runVisualization(): Promise<void> {
  if (!uploadedFile || !selectedProduct || !currentConfig) return;

  const fd = new FormData();
  fd.append("product_id", selectedProduct.id);
  fd.append("room_image", uploadedFile);
  if (selectedProduct.title) fd.append("product_title", selectedProduct.title);
  if (selectedProduct.type) fd.append("product_type", selectedProduct.type);
  if (selectedProduct.color) fd.append("product_color", selectedProduct.color);
  if (selectedProduct.imageUrl) fd.append("product_image_url", selectedProduct.imageUrl);
  if (selectedProduct.sku) fd.append("product_sku", selectedProduct.sku);

  try {
    const res = await fetch(currentConfig.apiUrl, { method: "POST", body: fd });

    if (!res.ok) { setState("error"); return; }

    const blob = await res.blob();
    if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl);
    resultBlobUrl = URL.createObjectURL(blob);

    const rawTitle = res.headers.get("X-Product-Title") ?? "";
    const productTitle = decodeURIComponent(rawTitle) || selectedProduct.title;

    currentState = "result";
    if (!modalEl) return;
    const titleEl = modalEl.querySelector<HTMLElement>(".rv-head-title");
    const body = modalEl.querySelector<HTMLElement>(".rv-body");
    if (titleEl) titleEl.textContent = STATE_TITLES["result"];
    if (body) renderResultState(body, resultBlobUrl, productTitle);
  } catch {
    setState("error");
  }
}

function buildModal(): HTMLElement {
  const overlay = document.createElement("div");
  overlay.id = "rv-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", "Odanda Gör");

  overlay.innerHTML = `
    <div id="rv-modal">
      <div id="rv-modal-head">
        <span class="rv-head-title">Odanda Gör</span>
        <button id="rv-close" aria-label="Kapat">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/>
          </svg>
        </button>
      </div>
      <div class="rv-body"></div>
    </div>
  `;

  overlay.querySelector<HTMLButtonElement>("#rv-close")?.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });

  return overlay;
}

export function initRoomVisualizer(config: RoomVisualizerConfig): void {
  injectStyles();
  currentConfig = config;

  if (!modalEl) {
    modalEl = buildModal();
    document.body.appendChild(modalEl);
  }

  uploadedFile = null;
  selectedProduct = null;
  if (resultBlobUrl) {
    URL.revokeObjectURL(resultBlobUrl);
    resultBlobUrl = null;
  }

  setState(config.productId ? "upload" : "picker");
  openModal();
}

// Expose globally for Liquid snippets
(globalThis as Record<string, unknown>)["initRoomVisualizer"] = initRoomVisualizer;
