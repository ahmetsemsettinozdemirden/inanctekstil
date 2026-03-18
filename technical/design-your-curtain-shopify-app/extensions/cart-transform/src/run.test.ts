import { describe, expect, test } from 'bun:test';
import { calculateCurtainPrice, run } from './run';

// ---------------------------------------------------------------------------
// calculateCurtainPrice — pure formula tests
// ---------------------------------------------------------------------------

describe('calculateCurtainPrice', () => {
  test('valid config: 200cm × 2.5 × 1 panel × 230 TL/m = 1150', () => {
    expect(calculateCurtainPrice({ enCm: 200, pileOrani: 2.5, kanat: 1, basePricePerMeter: 230 })).toBe(1150);
  });

  test('valid config: 150cm × 2.5 × 1 panel × 230 TL/m = 862.5', () => {
    expect(calculateCurtainPrice({ enCm: 150, pileOrani: 2.5, kanat: 1, basePricePerMeter: 230 })).toBe(862.5);
  });

  test('valid config: 200cm × 3.0 × 2 panels × 200 TL/m = 2400', () => {
    expect(calculateCurtainPrice({ enCm: 200, pileOrani: 3.0, kanat: 2, basePricePerMeter: 200 })).toBe(2400);
  });

  test('zero enCm returns null', () => {
    expect(calculateCurtainPrice({ enCm: 0, pileOrani: 2.5, kanat: 1, basePricePerMeter: 230 })).toBeNull();
  });

  test('negative basePricePerMeter returns null', () => {
    expect(calculateCurtainPrice({ enCm: 200, pileOrani: 2.5, kanat: 1, basePricePerMeter: -1 })).toBeNull();
  });

  test('zero kanat returns null', () => {
    expect(calculateCurtainPrice({ enCm: 200, pileOrani: 2.5, kanat: 0, basePricePerMeter: 230 })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// run — Cart Transform integration tests
// ---------------------------------------------------------------------------

type LineProps = Record<string, string>;

function makeLine(props: LineProps, basePricePerMeter = '230.00') {
  return {
    id: 'gid://shopify/CartLine/1',
    quantity: 1,
    merchandise: { id: 'gid://shopify/ProductVariant/123' },
    properties: Object.entries(props).map(([key, value]) => ({ key, value })),
    cost: { amountPerQuantity: { amount: basePricePerMeter, currencyCode: 'TRY' } },
  };
}

describe('run', () => {
  test('returns expand operation for valid curtain line', () => {
    const result = run({
      cart: { lines: [makeLine({ _en: '200', _pile_orani: '2.5', _kanat: '1' })] },
    });
    expect(result.operations).toHaveLength(1);
    const item = result.operations[0].expand.expandedCartItems[0];
    expect(item.price.adjustment.fixedPricePerUnit.amount).toBe('1150.00');
    expect(item.price.adjustment.fixedPricePerUnit.currencyCode).toBe('TRY');
  });

  test('skips line without curtain properties (missing properties)', () => {
    const result = run({ cart: { lines: [makeLine({})] } });
    expect(result.operations).toHaveLength(0);
  });

  test('skips line with zero dimensions', () => {
    const result = run({
      cart: { lines: [makeLine({ _en: '0', _pile_orani: '2.5', _kanat: '1' })] },
    });
    expect(result.operations).toHaveLength(0);
  });

  test('handles mixed cart: curtain and non-curtain lines', () => {
    const result = run({
      cart: {
        lines: [
          makeLine({ _en: '150', _pile_orani: '2.5', _kanat: '1' }),
          makeLine({}),
        ],
      },
    });
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0].expand.expandedCartItems[0].price.adjustment.fixedPricePerUnit.amount).toBe('862.50');
  });

  test('curtain line id and merchandise id passed through correctly', () => {
    const result = run({
      cart: { lines: [makeLine({ _en: '200', _pile_orani: '2.0', _kanat: '2' })] },
    });
    expect(result.operations[0].expand.cartLineId).toBe('gid://shopify/CartLine/1');
    expect(result.operations[0].expand.expandedCartItems[0].merchandiseId).toBe('gid://shopify/ProductVariant/123');
  });
});
