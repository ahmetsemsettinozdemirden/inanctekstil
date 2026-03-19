import { AppError } from "./base.ts";

export class ShopifyApiError extends AppError {
  constructor(message: string, errors: unknown[]) {
    super(message, "SHOPIFY_API_ERROR", 502, { errors });
  }
}

export class ShopifyRateLimitError extends AppError {
  constructor(retryAfter: number) {
    super("Shopify rate limit exceeded", "SHOPIFY_RATE_LIMIT", 429, { retryAfter });
  }
}

export class ShopifyNotConfiguredError extends AppError {
  constructor() {
    super(
      "Shopify credentials not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ACCESS_TOKEN.",
      "SHOPIFY_NOT_CONFIGURED",
      503,
    );
  }
}
