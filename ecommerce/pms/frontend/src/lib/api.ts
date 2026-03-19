// ---------------------------------------------------------------------------
// Types (mirror src/lib/catalog.ts DesignWithShopify)
// ---------------------------------------------------------------------------

export interface DesignFabric {
  material:     string | null;
  transparency: string | null;
  texture:      string | null;
  weight:       string | null;
  pattern:      string | null;
}

export interface DesignVariant {
  sku:     string;
  colour:  string;
  finish:  string | null;
  swatch:  string | null;
  shopify: { variant_id: string | null; status: string };
}

export interface Design {
  id:           string;
  curtain_type: string;
  design:       string;
  width_cm:     number;
  price:        number;
  composition:  string | null;
  fabric:       DesignFabric;
  shopify: {
    product_id:   string | null;
    handle:       string | null;
    product_type: string | null;
    status:       string;
    options:      string[];
  };
  variants: DesignVariant[];
}

export interface UpdateDesignPayload {
  price?:       number;
  composition?: string | null;
  fabric?:      Partial<DesignFabric>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(
      (body as { message?: string }).message ?? `HTTP ${res.status}`,
      res.status,
      (body as { error?: string }).error,
    );
  }
  return res.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export interface GeneratedImage {
  id:              number;
  sku:             string;
  imageType:       string;   // "lifestyle" | "texture"
  roomId:          string | null;
  filePath:        string;
  shopifyMediaId:  string | null;
  evaluationScore: number | null;
  createdAt:       string;
}

export interface GeneratePayload {
  sku:     string;
  flow:    "lifestyle" | "texture";
  roomId?: string;
}

export interface Room {
  id:         string;
  room_type:  string;
  wall_color: string;
}

export interface ShopifyStatusEntry {
  designId:    string;
  curtainType: string;
  design:      string;
  productId:   string | null;
  handle:      string | null;
  status:      string;
  syncedAt:    string | null;
}

export interface Metafield {
  id:        string;
  namespace: string;
  key:       string;
  value:     string;
  type:      string;
}

export const api = {
  catalog: {
    list: () => apiFetch<Design[]>("/api/catalog"),
    get:  (id: string) => apiFetch<Design>(`/api/catalog/${id}`),
    update: (id: string, payload: UpdateDesignPayload) =>
      apiFetch<Design>(`/api/catalog/${id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      }),
  },
  images: {
    generate: (payload: GeneratePayload) =>
      apiFetch<{ jobId: string }>("/api/images/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      }),
    generateBulk: (designId: string) =>
      apiFetch<{ jobId: string }>("/api/images/generate-bulk", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ designId }),
      }),
    analyze: (sku: string) =>
      apiFetch<{ jobId: string }>("/api/images/analyze", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ sku }),
      }),
    rooms:  () => apiFetch<Room[]>("/api/images/rooms/list"),
    bySku:  (sku: string) => apiFetch<{ lifestyle: GeneratedImage[]; texture: GeneratedImage | null }>(`/api/images/${sku}`),
  },
  jobs: {
    list:   () => apiFetch<import("./sse.ts").JobData[]>("/api/jobs"),
    get:    (id: string) => apiFetch<import("./sse.ts").JobData>(`/api/jobs/${id}`),
    cancel: (id: string) => apiFetch<import("./sse.ts").JobData>(`/api/jobs/${id}`, { method: "DELETE" }),
  },
  shopify: {
    status:       () => apiFetch<ShopifyStatusEntry[]>("/api/shopify/status"),
    sync:         (designId: string) => apiFetch<{ jobId: string }>(`/api/shopify/sync/${designId}`, { method: "POST" }),
    uploadImages: (sku: string) => apiFetch<{ jobId: string; pending: number }>(`/api/shopify/upload-images/${sku}`, { method: "POST" }),
    refreshAll:   () => apiFetch<{ total: number; refreshed: number; failed: number }>("/api/shopify/refresh-all", { method: "POST" }),
    product:      (designId: string) => apiFetch<{ id: string; handle: string; status: string }>(`/api/shopify/product/${designId}`),
    metafields: {
      get:  (productId: string, namespace = "custom") =>
        apiFetch<Metafield[]>(`/api/shopify/metafields/${productId}?namespace=${namespace}`),
      set:  (productId: string, fields: Array<{ namespace: string; key: string; value: string; type: string }>) =>
        apiFetch<Metafield[]>(`/api/shopify/metafields/${productId}`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(fields),
        }),
    },
  },
};

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

/** Convert swatch DB path → asset URL for <img src> */
export function swatchUrl(swatchPath: string | null | undefined): string {
  if (!swatchPath) return "";
  // "01-cropped-katalog-images/TUL/TUL-001.JPG" → "/assets/swatches/TUL/TUL-001.JPG"
  const parts = swatchPath.split("/");
  if (parts.length < 3) return "";
  return `/assets/swatches/${parts[1]}/${parts[2]}`;
}

/** Convert generated image file path → asset URL */
export function generatedImageUrl(
  curtainType: string,
  sku: string,
  filename: string,
): string {
  return `/assets/generated/${curtainType}/${sku}/${filename}`;
}
