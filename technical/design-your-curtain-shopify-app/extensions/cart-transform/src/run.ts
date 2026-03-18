/**
 * Cart Transform function — Perde Tasarla price calculation.
 *
 * Reads _en, _pile_orani, _kanat from line item properties and sets
 * the correct price using the formula:
 *   total = (en_cm / 100) × pile_orani × kanat × base_price_per_meter
 *
 * Items without these properties are left unchanged.
 */

// ---------------------------------------------------------------------------
// Types
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
  merchandise: {
    id: string;
  };
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
// Helpers
// ---------------------------------------------------------------------------

function getProperty(properties: CartLineProperty[], key: string): string | null {
  const prop = properties.find((p) => p.key === key);
  return prop ? prop.value : null;
}

// ---------------------------------------------------------------------------
// Function entry point
// ---------------------------------------------------------------------------

export function run(input: CartTransformInput): CartTransformResult {
  const operations: ExpandOperation[] = [];

  for (const line of input.cart.lines) {
    const enStr = getProperty(line.properties, '_en');
    const pileOraniStr = getProperty(line.properties, '_pile_orani');
    const kanatStr = getProperty(line.properties, '_kanat');

    // Skip non-curtain products (missing properties)
    if (!enStr || !pileOraniStr || !kanatStr) {
      continue;
    }

    const enCm = parseFloat(enStr);
    const pileOrani = parseFloat(pileOraniStr);
    const kanat = parseFloat(kanatStr);
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
