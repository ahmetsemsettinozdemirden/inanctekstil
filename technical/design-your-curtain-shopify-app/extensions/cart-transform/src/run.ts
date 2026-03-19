/**
 * Cart Transform function — Perde Tasarla price calculation.
 *
 * Reads _en, _pile_orani, _kanat from line item attributes and sets
 * the correct price using the formula:
 *   total = (en_cm / 100) × pile_orani × kanat × base_price_per_meter
 *
 * Items without these attributes are left unchanged.
 */

// ---------------------------------------------------------------------------
// Types (matching input.graphql)
// ---------------------------------------------------------------------------

interface Money {
  amount: string;
  currencyCode: string;
}

interface Attribute {
  value: string;
}

interface CartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
  };
  en: Attribute | null;
  pileOrani: Attribute | null;
  kanat: Attribute | null;
  cost: {
    amountPerQuantity: Money;
  };
}

interface CartTransformInput {
  cart: {
    lines: CartLine[];
  };
}

interface ExpandedCartItem {
  merchandiseId: string;
  quantity: number;
  price: {
    adjustment: {
      fixedPricePerUnit: {
        amount: string;
        currencyCode: string;
      };
    };
  };
}

interface ExpandOperation {
  expand: {
    cartLineId: string;
    expandedCartItems: ExpandedCartItem[];
  };
}

interface CartTransformResult {
  operations: ExpandOperation[];
}

// ---------------------------------------------------------------------------
// Pure price calculation
// ---------------------------------------------------------------------------

export interface PriceConfig {
  enCm: number;
  pileOrani: number;
  kanat: number;
  basePricePerMeter: number;
}

/**
 * Calculates the total curtain price.
 * Returns null if any input is zero or negative (invalid config).
 */
export function calculateCurtainPrice(config: PriceConfig): number | null {
  const { enCm, pileOrani, kanat, basePricePerMeter } = config;
  if (enCm <= 0 || pileOrani <= 0 || kanat <= 0 || basePricePerMeter <= 0) {
    return null;
  }
  return (enCm / 100) * pileOrani * kanat * basePricePerMeter;
}

// ---------------------------------------------------------------------------
// Function entry point
// ---------------------------------------------------------------------------

export function run(input: CartTransformInput): CartTransformResult {
  const operations: ExpandOperation[] = [];

  for (const line of input.cart.lines) {
    // Skip non-curtain products (missing attributes)
    if (!line.en || !line.pileOrani || !line.kanat) {
      continue;
    }

    const enCm = parseFloat(line.en.value);
    const pileOrani = parseFloat(line.pileOrani.value);
    const kanat = parseFloat(line.kanat.value);
    const basePricePerMeter = parseFloat(line.cost.amountPerQuantity.amount);

    const price = calculateCurtainPrice({ enCm, pileOrani, kanat, basePricePerMeter });

    // Skip if calculation invalid (NaN, zero, or negative dimensions)
    if (price === null || isNaN(price)) {
      continue;
    }

    operations.push({
      expand: {
        cartLineId: line.id,
        expandedCartItems: [
          {
            merchandiseId: line.merchandise.id,
            quantity: line.quantity,
            price: {
              adjustment: {
                fixedPricePerUnit: {
                  amount: price.toFixed(2),
                  currencyCode: line.cost.amountPerQuantity.currencyCode,
                },
              },
            },
          },
        ],
      },
    });
  }

  return { operations };
}

export default run;
