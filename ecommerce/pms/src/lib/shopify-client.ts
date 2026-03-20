import { getShopifyConfig } from "./env.ts";
import { logger } from "./logger.ts";
import {
  ShopifyApiError,
  ShopifyRateLimitError,
  ShopifyNotConfiguredError,
} from "../errors/shopify.ts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ShopifyVariant {
  id: string;     // GID: "gid://shopify/ProductVariant/123"
  sku: string;
  title: string;
}

export interface ShopifyProduct {
  id: string;     // GID: "gid://shopify/Product/456"
  handle: string;
  title: string;
  status: string;
  description: string | null;
  tags: string[];
  variants: ShopifyVariant[];
}

export interface ProductVariantInput {
  id?: string;         // provided when updating
  sku: string;
  price: string;       // e.g. "299.00"
  options: string[];   // option values e.g. ["Beyaz"]
  inventoryManagement?: "NOT_SHOPIFY";
  inventoryPolicy?: "CONTINUE" | "DENY";
}

export interface ProductInput {
  id?: string;
  title: string;
  productType: string;
  descriptionHtml?: string;
  status?: "ACTIVE" | "DRAFT" | "ARCHIVED";
  tags?: string[];
  vendor?: string;
  options?: string[];  // option names e.g. ["Renk"]
  variants?: ProductVariantInput[];
}

export interface MetafieldInput {
  ownerId:   string;
  namespace: string;
  key:       string;
  value:     string;
  type:      string;  // e.g. "single_line_text_field", "number_integer"
}

export interface Metafield {
  id:        string;
  namespace: string;
  key:       string;
  value:     string;
  type:      string;
}

export interface StagedUploadInput {
  filename:   string;
  mimeType:   string;
  httpMethod: "POST" | "PUT";
  resource:   "IMAGE";
  fileSize:   string;   // bytes as string
}

export interface StagedUploadTarget {
  url:         string;
  resourceUrl: string;
  parameters:  Array<{ name: string; value: string }>;
}

export interface ProductMedia {
  id:     string;  // GID for MediaImage
  status: string;  // UPLOADED | PROCESSING | READY | FAILED
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const API_VERSION = "2024-01";
const MAX_RETRIES = 3;

export class ShopifyClient {
  private readonly token: string;
  private readonly endpoint: string;

  constructor(domain: string, token: string) {
    this.token    = token;
    this.endpoint = `https://${domain}/admin/api/${API_VERSION}/graphql.json`;
  }

  /** Factory that reads credentials from env — throws ShopifyNotConfiguredError if missing */
  static fromEnv(): ShopifyClient {
    try {
      const { domain, token } = getShopifyConfig();
      return new ShopifyClient(domain, token);
    } catch {
      throw new ShopifyNotConfiguredError();
    }
  }

  // -------------------------------------------------------------------------
  // Products
  // -------------------------------------------------------------------------

  async createProduct(input: ProductInput): Promise<ShopifyProduct> {
    const data = await this.gql<{ productCreate: { product: ShopifyProductRaw; userErrors: UserError[] } }>(
      `mutation productCreate($input: ProductInput!) {
        productCreate(input: $input) {
          product {
            id handle status
            variants(first: 100) { nodes { id sku title } }
          }
          userErrors { field message }
        }
      }`,
      { input: buildProductInput(input) },
    );
    assertNoErrors(data.productCreate.userErrors, "productCreate");
    return parseProduct(data.productCreate.product);
  }

  async updateProduct(productId: string, input: Omit<ProductInput, "id" | "variants" | "options">): Promise<ShopifyProduct> {
    const data = await this.gql<{ productUpdate: { product: ShopifyProductRaw; userErrors: UserError[] } }>(
      `mutation productUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product { id handle title status descriptionHtml tags variants(first: 100) { nodes { id sku title } } }
          userErrors { field message }
        }
      }`,
      { input: { id: productId, ...input } },
    );
    assertNoErrors(data.productUpdate.userErrors, "productUpdate");
    return parseProduct(data.productUpdate.product);
  }

  async getProduct(productId: string): Promise<ShopifyProduct | null> {
    const data = await this.gql<{ product: ShopifyProductRaw | null }>(
      `query getProduct($id: ID!) {
        product(id: $id) {
          id handle title status descriptionHtml tags
          variants(first: 100) { nodes { id sku title } }
        }
      }`,
      { id: productId },
    );
    return data.product ? parseProduct(data.product) : null;
  }

  // -------------------------------------------------------------------------
  // Variants
  // -------------------------------------------------------------------------

  async variantsBulkCreate(productId: string, variants: ProductVariantInput[]): Promise<ShopifyVariant[]> {
    const data = await this.gql<{
      productVariantsBulkCreate: { productVariants: Array<{ id: string; sku: string; title: string }>; userErrors: UserError[] }
    }>(
      `mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkCreate(productId: $productId, variants: $variants) {
          productVariants { id sku title }
          userErrors { field message }
        }
      }`,
      { productId, variants: variants.map(buildVariantBulkInput) },
    );
    assertNoErrors(data.productVariantsBulkCreate.userErrors, "productVariantsBulkCreate");
    return data.productVariantsBulkCreate.productVariants;
  }

  async variantsBulkUpdate(productId: string, variants: (ProductVariantInput & { id: string })[]): Promise<ShopifyVariant[]> {
    const data = await this.gql<{
      productVariantsBulkUpdate: { productVariants: Array<{ id: string; sku: string; title: string }>; userErrors: UserError[] }
    }>(
      `mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
          productVariants { id sku title }
          userErrors { field message }
        }
      }`,
      { productId, variants: variants.map(v => ({ id: v.id, ...buildVariantBulkInput(v) })) },
    );
    assertNoErrors(data.productVariantsBulkUpdate.userErrors, "productVariantsBulkUpdate");
    return data.productVariantsBulkUpdate.productVariants;
  }

  // -------------------------------------------------------------------------
  // Collections
  // -------------------------------------------------------------------------

  async getCollectionByHandle(handle: string): Promise<string | null> {
    const data = await this.gql<{ collectionByHandle: { id: string } | null }>(
      `query getCollectionByHandle($handle: String!) {
        collectionByHandle(handle: $handle) { id }
      }`,
      { handle },
    );
    return data.collectionByHandle?.id ?? null;
  }

  async addProductToCollection(collectionId: string, productId: string): Promise<void> {
    const data = await this.gql<{
      collectionAddProducts: { userErrors: UserError[] }
    }>(
      `mutation collectionAddProducts($id: ID!, $productIds: [ID!]!) {
        collectionAddProducts(id: $id, productIds: $productIds) {
          userErrors { field message }
        }
      }`,
      { id: collectionId, productIds: [productId] },
    );
    assertNoErrors(data.collectionAddProducts.userErrors, "collectionAddProducts");
  }

  // -------------------------------------------------------------------------
  // Media upload (staged upload → productCreateMedia)
  // -------------------------------------------------------------------------

  /** Step 1 — Request pre-signed upload targets from Shopify. */
  async stagedUploadsCreate(inputs: StagedUploadInput[]): Promise<StagedUploadTarget[]> {
    const data = await this.gql<{
      stagedUploadsCreate: { stagedTargets: StagedUploadTarget[]; userErrors: UserError[] }
    }>(
      `mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $input) {
          stagedTargets { url resourceUrl parameters { name value } }
          userErrors { field message }
        }
      }`,
      { input: inputs },
    );
    assertNoErrors(data.stagedUploadsCreate.userErrors, "stagedUploadsCreate");
    return data.stagedUploadsCreate.stagedTargets;
  }

  /**
   * Step 2 — Upload a file to the pre-signed URL obtained from stagedUploadsCreate.
   * Uses multipart POST (works for both GCS and S3 staged targets).
   */
  async uploadToStagedTarget(
    target: StagedUploadTarget,
    fileBuffer: Uint8Array,
    mimeType: string,
    filename: string,
  ): Promise<void> {
    const form = new FormData();
    for (const p of target.parameters) {
      form.append(p.name, p.value);
    }
    form.append("file", new Blob([fileBuffer], { type: mimeType }), filename);

    const res = await fetch(target.url, { method: "POST", body: form });
    if (!res.ok && res.status !== 204) {
      const body = await res.text();
      throw new ShopifyApiError(`Staged upload failed (HTTP ${res.status}): ${body}`, []);
    }
  }

  /** Step 3 — Attach uploaded files to a product as media. */
  async productCreateMedia(
    productId: string,
    media: Array<{ originalSource: string; alt?: string }>,
  ): Promise<ProductMedia[]> {
    const data = await this.gql<{
      productCreateMedia: {
        media: Array<{ id?: string; status: string }>;
        mediaUserErrors: UserError[];
      }
    }>(
      `mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
        productCreateMedia(productId: $productId, media: $media) {
          media { ... on MediaImage { id status } }
          mediaUserErrors { field message }
          product { id }
        }
      }`,
      {
        productId,
        media: media.map((m) => ({
          originalSource:   m.originalSource,
          alt:              m.alt ?? "",
          mediaContentType: "IMAGE",
        })),
      },
    );
    assertNoErrors(data.productCreateMedia.mediaUserErrors, "productCreateMedia");
    return data.productCreateMedia.media
      .filter((m) => m.id)
      .map((m) => ({ id: m.id!, status: m.status }));
  }

  // -------------------------------------------------------------------------
  // Metafields
  // -------------------------------------------------------------------------

  async setMetafields(metafields: MetafieldInput[]): Promise<Metafield[]> {
    const data = await this.gql<{
      metafieldsSet: { metafields: Metafield[]; userErrors: UserError[] }
    }>(
      `mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id namespace key value type }
          userErrors { field message }
        }
      }`,
      { metafields },
    );
    assertNoErrors(data.metafieldsSet.userErrors, "metafieldsSet");
    return data.metafieldsSet.metafields;
  }

  async getMetafields(ownerId: string, namespace: string): Promise<Metafield[]> {
    const data = await this.gql<{
      product: { metafields: { nodes: Metafield[] } } | null
    }>(
      `query getMetafields($id: ID!, $namespace: String!) {
        product(id: $id) {
          metafields(first: 50, namespace: $namespace) {
            nodes { id namespace key value type }
          }
        }
      }`,
      { id: ownerId, namespace },
    );
    return data.product?.metafields.nodes ?? [];
  }

  // -------------------------------------------------------------------------
  // Core GraphQL executor
  // -------------------------------------------------------------------------

  async gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      attempt++;
      logger.debug({ query: query.slice(0, 80), variables }, "Shopify GraphQL request");

      const res = await fetch(this.endpoint, {
        method:  "POST",
        headers: {
          "Content-Type":              "application/json",
          "X-Shopify-Access-Token":    this.token,
        },
        body: JSON.stringify({ query, variables }),
      });

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("Retry-After") ?? "2", 10);
        logger.warn({ retryAfter, attempt }, "Shopify rate limit — waiting before retry");
        if (attempt >= MAX_RETRIES) throw new ShopifyRateLimitError(retryAfter);
        await sleep(retryAfter * 1000);
        continue;
      }

      if (!res.ok) {
        const body = await res.text();
        logger.error({ status: res.status, body }, "Shopify HTTP error");
        throw new ShopifyApiError(`Shopify HTTP ${res.status}`, [body]);
      }

      const json = await res.json() as { data?: T; errors?: Array<{ message: string }> };

      if (json.errors?.length) {
        logger.error({ errors: json.errors }, "Shopify GraphQL errors");
        throw new ShopifyApiError("Shopify GraphQL error", json.errors);
      }

      return json.data as T;
    }

    throw new ShopifyApiError("Shopify request failed after max retries", []);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface UserError { field: string[]; message: string; }

interface ShopifyProductRaw {
  id: string;
  handle: string;
  title: string;
  status: string;
  descriptionHtml?: string;
  tags?: string[];
  variants: { nodes: Array<{ id: string; sku: string; title: string }> };
}

function parseProduct(raw: ShopifyProductRaw): ShopifyProduct {
  return {
    id:          raw.id,
    handle:      raw.handle,
    title:       raw.title,
    status:      raw.status,
    description: raw.descriptionHtml ?? null,
    tags:        raw.tags ?? [],
    variants:    raw.variants.nodes,
  };
}

function assertNoErrors(errors: UserError[], mutation: string): void {
  if (errors.length > 0) {
    throw new ShopifyApiError(
      `${mutation} returned errors: ${errors.map(e => e.message).join("; ")}`,
      errors,
    );
  }
}

function buildProductInput(input: ProductInput): Record<string, unknown> {
  const out: Record<string, unknown> = {
    title:       input.title,
    productType: input.productType,
    status:      input.status ?? "DRAFT",
  };
  if (input.id)              out.id              = input.id;
  if (input.descriptionHtml) out.descriptionHtml = input.descriptionHtml;
  if (input.tags)            out.tags            = input.tags;
  if (input.vendor)          out.vendor          = input.vendor;
  if (input.options)         out.options         = input.options;
  if (input.variants)        out.variants        = input.variants.map(buildVariantInput);
  return out;
}

function buildVariantInput(v: ProductVariantInput): Record<string, unknown> {
  return {
    sku:                 v.sku,
    price:               v.price,
    options:             v.options,
    inventoryManagement: v.inventoryManagement ?? "NOT_SHOPIFY",
    inventoryPolicy:     v.inventoryPolicy     ?? "CONTINUE",
  };
}

function buildVariantBulkInput(v: ProductVariantInput): Record<string, unknown> {
  const out: Record<string, unknown> = {
    sku:                 v.sku,
    price:               v.price,
    options:             v.options,
    inventoryManagement: v.inventoryManagement ?? "NOT_SHOPIFY",
    inventoryPolicy:     v.inventoryPolicy     ?? "CONTINUE",
  };
  if (v.id) out.id = v.id;
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
