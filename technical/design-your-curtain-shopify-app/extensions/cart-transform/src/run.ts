/**
 * Cart Transform function scaffold.
 * Price calculation logic implemented in US-008.
 *
 * NOTE: Type definitions below are hand-written stubs.
 * After `shopify app deploy`, run `shopify app function typegen` to replace
 * with auto-generated types from the Cart Transform GraphQL schema.
 */

// ---------------------------------------------------------------------------
// Type stubs — replaced by generated types after initial deploy
// ---------------------------------------------------------------------------

interface Money {
  amount: string;
  currencyCode: string;
}

interface CartLineProperty {
  key: string;
  value: string;
}

interface CartLine {
  id: string;
  quantity: number;
  properties: CartLineProperty[];
  cost: {
    amountPerQuantity: Money;
  };
}

interface CartTransformInput {
  cart: {
    lines: CartLine[];
  };
}

interface CartTransformResult {
  operations: unknown[];
}

// ---------------------------------------------------------------------------
// Function entry point
// ---------------------------------------------------------------------------

export function run(_input: CartTransformInput): CartTransformResult {
  // TODO: implement price calculation in US-008
  return { operations: [] };
}
