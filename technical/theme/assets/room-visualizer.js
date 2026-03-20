(() => {
  // assets/room-visualizer.ts
  var FONTS_URL = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;600&display=swap";
  var STYLES = `
  @import url('${FONTS_URL}');

  #rv-overlay {
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(0,0,0,0.75);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Inter', sans-serif;
  }
  #rv-modal {
    background: #fff; border-radius: 12px;
    width: min(520px, 95vw); max-height: 90vh;
    overflow-y: auto; position: relative;
    box-shadow: 0 24px 64px rgba(0,0,0,0.3);
  }
  #rv-close {
    position: absolute; top: 12px; right: 16px;
    background: none; border: none; font-size: 24px; cursor: pointer;
    color: #333; line-height: 1; padding: 4px 8px;
  }
  .rv-header {
    padding: 24px 24px 0;
    font-family: 'Playfair Display', serif;
    font-size: 22px; font-weight: 700; color: #1B2A4A;
  }
  .rv-body { padding: 20px 24px 24px; }
  .rv-btn {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 12px 24px; border-radius: 8px; font-size: 15px;
    font-weight: 600; cursor: pointer; border: none;
    font-family: 'Inter', sans-serif;
  }
  .rv-btn-primary { background: #1B2A4A; color: #fff; width: 100%; }
  .rv-btn-primary:hover { background: #2a3f6e; }
  .rv-btn-secondary {
    background: transparent; color: #1B2A4A;
    border: 2px solid #1B2A4A; width: 100%;
    margin-top: 10px;
  }
  .rv-dropzone {
    border: 2px dashed #ccc; border-radius: 8px;
    padding: 40px 20px; text-align: center; cursor: pointer;
    transition: border-color 0.2s; color: #666;
    margin-bottom: 16px;
  }
  .rv-dropzone:hover, .rv-dropzone.rv-dragover { border-color: #1B2A4A; }
  .rv-dropzone svg { margin-bottom: 8px; }
  .rv-dropzone p { margin: 0; font-size: 14px; }
  .rv-error-msg { color: #c00; font-size: 13px; margin-top: 8px; }
  .rv-products-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px; margin-bottom: 16px;
  }
  .rv-product-card {
    border: 2px solid #e5e5e5; border-radius: 8px;
    overflow: hidden; cursor: pointer; transition: border-color 0.2s;
  }
  .rv-product-card:hover, .rv-product-card.selected { border-color: #1B2A4A; }
  .rv-product-card img { width: 100%; aspect-ratio: 1; object-fit: cover; display: block; }
  .rv-product-card span {
    display: block; padding: 6px 8px; font-size: 11px;
    color: #333; line-height: 1.3;
  }
  .rv-type-label {
    font-size: 12px; font-weight: 600; color: #1B2A4A;
    text-transform: uppercase; margin: 12px 0 6px;
  }
  .rv-loading-wrap {
    display: flex; flex-direction: column; align-items: center;
    padding: 32px 0; gap: 16px;
  }
  .rv-loading-img {
    width: 100%; max-height: 240px; object-fit: cover;
    border-radius: 8px; opacity: 0.4;
  }
  .rv-spinner {
    width: 40px; height: 40px;
    border: 4px solid #e5e5e5; border-top-color: #1B2A4A;
    border-radius: 50%; animation: rv-spin 0.8s linear infinite;
  }
  @keyframes rv-spin { to { transform: rotate(360deg); } }
  .rv-loading-text { color: #333; font-size: 14px; }
  .rv-result-img { width: 100%; border-radius: 8px; display: block; }
  .rv-product-name { font-size: 15px; font-weight: 600; color: #1B2A4A; margin: 12px 0 16px; }
  .rv-btns { display: flex; flex-direction: column; gap: 8px; }
  .rv-error-wrap { text-align: center; padding: 24px 0; }
  .rv-error-icon { font-size: 48px; margin-bottom: 12px; }
  .rv-error-text { color: #333; font-size: 15px; margin-bottom: 16px; }
  .rv-back-link {
    background: none; border: none; color: #1B2A4A;
    text-decoration: underline; cursor: pointer;
    font-size: 13px; margin-top: 10px; display: block;
  }
`;
  function injectStyles() {
    if (document.getElementById("rv-styles")) return;
    const style = document.createElement("style");
    style.id = "rv-styles";
    style.textContent = STYLES;
    document.head.appendChild(style);
  }
  var modalEl = null;
  var currentConfig = null;
  var currentState = "upload";
  var uploadedFile = null;
  var selectedProduct = null;
  var resultBlobUrl = null;
  function openModal() {
    if (!modalEl) return;
    modalEl.style.display = "flex";
  }
  function closeModal() {
    if (!modalEl) return;
    modalEl.style.display = "none";
    if (resultBlobUrl) {
      URL.revokeObjectURL(resultBlobUrl);
      resultBlobUrl = null;
    }
  }
  function renderUploadState(body) {
    body.innerHTML = `
    <div id="rv-dropzone" class="rv-dropzone" role="button" tabindex="0" aria-label="Oda foto\u011Fraf\u0131 y\xFCkle">
      <svg width="48" height="48" fill="none" stroke="#aaa" stroke-width="2" viewBox="0 0 24 24">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      <p>Foto\u011Fraf\u0131 buraya s\xFCr\xFCkleyin veya se\xE7in</p>
      <p style="font-size:12px;color:#999;margin-top:4px">JPG, PNG, WEBP \u2014 maks. 10MB</p>
    </div>
    <input id="rv-file-input" type="file" accept="image/jpeg,image/png,image/webp" style="display:none" />
    <button class="rv-btn rv-btn-primary" id="rv-select-btn">Galeriden Se\xE7</button>
    <button class="rv-btn rv-btn-secondary" id="rv-camera-btn" style="display:none">Kamera</button>
    <div id="rv-upload-error" class="rv-error-msg" style="display:none"></div>
  `;
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const cameraBtn = body.querySelector("#rv-camera-btn");
    if (cameraBtn && isMobile) {
      cameraBtn.style.display = "inline-flex";
    }
    const fileInput = body.querySelector("#rv-file-input");
    const dropzone = body.querySelector("#rv-dropzone");
    const selectBtn = body.querySelector("#rv-select-btn");
    const camBtn = body.querySelector("#rv-camera-btn");
    const errorEl = body.querySelector("#rv-upload-error");
    function handleFile(file) {
      const err = validateFile(file);
      if (err) {
        showUploadError(errorEl, err);
        return;
      }
      uploadedFile = file;
      proceedFromUpload();
    }
    selectBtn == null ? void 0 : selectBtn.addEventListener("click", () => fileInput == null ? void 0 : fileInput.click());
    camBtn == null ? void 0 : camBtn.addEventListener("click", () => {
      const cam = document.createElement("input");
      cam.type = "file";
      cam.accept = "image/*";
      cam.capture = "environment";
      cam.onchange = () => {
        var _a;
        if ((_a = cam.files) == null ? void 0 : _a[0]) handleFile(cam.files[0]);
      };
      cam.click();
    });
    fileInput == null ? void 0 : fileInput.addEventListener("change", () => {
      var _a;
      if ((_a = fileInput.files) == null ? void 0 : _a[0]) handleFile(fileInput.files[0]);
    });
    dropzone == null ? void 0 : dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("rv-dragover");
    });
    dropzone == null ? void 0 : dropzone.addEventListener("dragleave", () => dropzone.classList.remove("rv-dragover"));
    dropzone == null ? void 0 : dropzone.addEventListener("drop", (e) => {
      var _a;
      e.preventDefault();
      dropzone.classList.remove("rv-dragover");
      const file = (_a = e.dataTransfer) == null ? void 0 : _a.files[0];
      if (file) handleFile(file);
    });
    dropzone == null ? void 0 : dropzone.addEventListener("click", () => fileInput == null ? void 0 : fileInput.click());
    dropzone == null ? void 0 : dropzone.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") fileInput == null ? void 0 : fileInput.click();
    });
  }
  function validateFile(file) {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) return "Ge\xE7ersiz format. L\xFCtfen JPG, PNG veya WEBP y\xFCkleyin.";
    if (file.size > 10 * 1024 * 1024) return "Dosya 10MB'den b\xFCy\xFCk olamaz.";
    return null;
  }
  function showUploadError(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = "block";
  }
  function proceedFromUpload() {
    var _a;
    if (!currentConfig) return;
    if (selectedProduct) {
      setState("loading");
      runVisualization();
    } else if (currentConfig.productId) {
      selectedProduct = { id: currentConfig.productId, handle: (_a = currentConfig.productHandle) != null ? _a : "" };
      setState("loading");
      runVisualization();
    } else {
      setState("picker");
    }
  }
  function renderPickerState(body) {
    var _a;
    const products = (currentConfig == null ? void 0 : currentConfig.dataProductsJson) ? JSON.parse(currentConfig.dataProductsJson) : [];
    const byType = /* @__PURE__ */ new Map();
    for (const p of products) {
      if (!byType.has(p.type)) byType.set(p.type, []);
      byType.get(p.type).push(p);
    }
    const groups = Array.from(byType.entries()).map(([type, items]) => `
      <div class="rv-type-label">${type}</div>
      <div class="rv-products-grid">
        ${items.map((p) => `
          <div class="rv-product-card" data-id="${p.id}" data-handle="${p.handle}" tabindex="0" role="button">
            <img src="${p.imageUrl}" alt="${p.title}" loading="lazy" />
            <span>${p.title}</span>
          </div>
        `).join("")}
      </div>
    `).join("");
    body.innerHTML = `
    <p style="color:#666;font-size:13px;margin:0 0 12px">Odan\u0131za eklemek istedi\u011Finiz perdeyi se\xE7in.</p>
    ${groups || "<p>\xDCr\xFCn bulunamad\u0131.</p>"}
    <button class="rv-back-link" id="rv-back-picker">\u2190 Geri</button>
  `;
    body.querySelectorAll(".rv-product-card").forEach((card) => {
      function select() {
        body.querySelectorAll(".rv-product-card").forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        const id = card.dataset["id"];
        const handle = card.dataset["handle"];
        selectedProduct = { id, handle };
        setTimeout(() => {
          if (uploadedFile) {
            setState("loading");
            runVisualization();
          } else {
            setState("upload");
          }
        }, 300);
      }
      card.addEventListener("click", select);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter") select();
      });
    });
    (_a = body.querySelector("#rv-back-picker")) == null ? void 0 : _a.addEventListener("click", () => {
      selectedProduct = null;
      setState("upload");
    });
  }
  function renderLoadingState(body) {
    const previewUrl = uploadedFile ? URL.createObjectURL(uploadedFile) : "";
    body.innerHTML = `
    <div class="rv-loading-wrap">
      ${previewUrl ? `<img class="rv-loading-img" src="${previewUrl}" alt="Oda foto\u011Fraf\u0131" />` : ""}
      <div class="rv-spinner"></div>
      <p class="rv-loading-text">Yapay zeka odan\u0131z\u0131 haz\u0131rl\u0131yor</p>
    </div>
  `;
  }
  function renderResultState(body, blobUrl, productTitle) {
    var _a, _b;
    const fromProductPage = !!(currentConfig == null ? void 0 : currentConfig.productId);
    const handle = (_a = selectedProduct == null ? void 0 : selectedProduct.handle) != null ? _a : "";
    body.innerHTML = `
    <img class="rv-result-img" src="${blobUrl}" alt="AI ile olu\u015Fturulmu\u015F oda g\xF6rseli" />
    <p class="rv-product-name">${productTitle}</p>
    <div class="rv-btns">
      <button class="rv-btn rv-btn-primary" id="rv-order-btn">Sipari\u015F Ver</button>
      <button class="rv-btn rv-btn-secondary" id="rv-save-btn">Kaydet</button>
    </div>
  `;
    (_b = body.querySelector("#rv-order-btn")) == null ? void 0 : _b.addEventListener("click", () => {
      closeModal();
      if (fromProductPage) {
        const configurator = document.querySelector("[data-section-type='curtain-configurator'], #curtain-configurator, .curtain-configurator");
        if (configurator) {
          configurator.scrollIntoView({ behavior: "smooth" });
        }
      } else {
        window.location.href = `/${handle}`;
      }
    });
    const saveBtn = body.querySelector("#rv-save-btn");
    if (saveBtn) {
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        saveBtn.addEventListener("click", async () => {
          try {
            const res = await fetch(blobUrl);
            const blob = await res.blob();
            const file = new File([blob], "odanda-gor.jpg", { type: "image/jpeg" });
            await navigator.share({ files: [file], title: productTitle });
          } catch (e) {
            downloadImage(blobUrl);
          }
        });
      } else {
        saveBtn.addEventListener("click", () => downloadImage(blobUrl));
      }
    }
  }
  function downloadImage(blobUrl) {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = "odanda-gor.jpg";
    a.click();
  }
  function renderErrorState(body) {
    var _a;
    body.innerHTML = `
    <div class="rv-error-wrap">
      <div class="rv-error-icon">\u26A0\uFE0F</div>
      <p class="rv-error-text">G\xF6rsel olu\u015Fturulamad\u0131. L\xFCtfen tekrar deneyin.</p>
      <button class="rv-btn rv-btn-primary" id="rv-retry-btn">Tekrar Dene</button>
    </div>
  `;
    (_a = body.querySelector("#rv-retry-btn")) == null ? void 0 : _a.addEventListener("click", () => {
      uploadedFile = null;
      selectedProduct = null;
      setState("upload");
    });
  }
  function setState(state) {
    currentState = state;
    if (!modalEl) return;
    const header = modalEl.querySelector(".rv-header");
    const body = modalEl.querySelector(".rv-body");
    if (!header || !body) return;
    const titles = {
      upload: "Odanda G\xF6r",
      picker: "Perde Se\xE7in",
      loading: "Odanda G\xF6r",
      result: "Sonu\xE7",
      error: "Hata"
    };
    header.textContent = titles[state];
    if (state === "upload") renderUploadState(body);
    else if (state === "picker") renderPickerState(body);
    else if (state === "loading") renderLoadingState(body);
    else if (state === "error") renderErrorState(body);
  }
  async function runVisualization() {
    var _a;
    if (!uploadedFile || !selectedProduct || !currentConfig) return;
    const fd = new FormData();
    fd.append("product_id", selectedProduct.id);
    fd.append("room_image", uploadedFile);
    try {
      const res = await fetch(`${currentConfig.apiUrl}/`, {
        method: "POST",
        body: fd
      });
      if (!res.ok) {
        setState("error");
        return;
      }
      const blob = await res.blob();
      if (resultBlobUrl) URL.revokeObjectURL(resultBlobUrl);
      resultBlobUrl = URL.createObjectURL(blob);
      const rawTitle = (_a = res.headers.get("X-Product-Title")) != null ? _a : "";
      const productTitle = decodeURIComponent(rawTitle);
      currentState = "result";
      if (!modalEl) return;
      const header = modalEl.querySelector(".rv-header");
      const body = modalEl.querySelector(".rv-body");
      if (header) header.textContent = "Sonu\xE7";
      if (body) renderResultState(body, resultBlobUrl, productTitle);
    } catch (e) {
      setState("error");
    }
  }
  function buildModal() {
    var _a;
    const overlay = document.createElement("div");
    overlay.id = "rv-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Odanda G\xF6r");
    overlay.innerHTML = `
    <div id="rv-modal">
      <button id="rv-close" aria-label="Kapat">&times;</button>
      <div class="rv-header">Odanda G\xF6r</div>
      <div class="rv-body"></div>
    </div>
  `;
    (_a = overlay.querySelector("#rv-close")) == null ? void 0 : _a.addEventListener("click", closeModal);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal();
    });
    return overlay;
  }
  function initRoomVisualizer(config) {
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
  globalThis["initRoomVisualizer"] = initRoomVisualizer;
})();
