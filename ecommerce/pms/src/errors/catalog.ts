import { AppError } from "./base.ts";

export class DesignNotFoundError extends AppError {
  constructor(id: string) {
    super(`Design not found: ${id}`, "DESIGN_NOT_FOUND", 404, { id });
  }
}

export class VariantNotFoundError extends AppError {
  constructor(sku: string) {
    super(`Variant not found: ${sku}`, "VARIANT_NOT_FOUND", 404, { sku });
  }
}

export class InvalidUpdateError extends AppError {
  constructor(message: string, fields?: string[]) {
    super(message, "INVALID_UPDATE", 400, fields ? { fields } : undefined);
  }
}
