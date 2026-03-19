import { describe, expect, test } from 'bun:test';
import { calculateCurtainPrice, run } from './run';

// ---------------------------------------------------------------------------
// calculateCurtainPrice — pure formula tests
// ---------------------------------------------------------------------------

describe('calculateCurtainPrice', () => {
  // --- valid configs ---
  test('valid config: 200cm × 2.5 × 1 panel × 230 TL/m = 1150', () => {
    expect(calculateCurtainPrice({ enCm: 200, pileOrani: 2.5, kanat: 1, basePricePerMeter: 230 })).toBe(1150);
  });

  test('valid config: 150cm × 2.5 × 1 panel × 230 TL/m = 862.5', () => {
    expect(calculateCurtainPrice({ enCm: 150, pileOrani: 2.5, kanat: 1, basePricePerMeter: 230 })).toBe(862.5);
  });

  test('valid config: 200cm × 3.0 × 2 panels × 200 TL/m = 2400', () => {
    expect(calculateCurtainPrice({ enCm: 200, pileOrani: 3.0, kanat: 2, basePricePerMeter: 200 })).toBe(2400);
  });

  test('valid config: 100cm × 2.0 × 1 panel × 300 TL/m = 600', () => {
    expect(calculateCurtainPrice({ enCm: 100, pileOrani: 2.0, kanat: 1, basePricePerMeter: 300 })).toBe(600);
  });

  test('valid config: 300cm × 3.0 × 2 panels × 150 TL/m = 2700', () => {
    expect(calculateCurtainPrice({ enCm: 300, pileOrani: 3.0, kanat: 2, basePricePerMeter: 150 })).toBe(2700);
  });

  // --- formula correctness ---
  test('formula: (enCm / 100) × pileOrani × kanat × basePricePerMeter', () => {
    // 250cm × 2.5 × 2 × 180 = (2.5) × 2.5 × 2 × 180 = 2250
    expect(calculateCurtainPrice({ enCm: 250, pileOrani: 2.5, kanat: 2, basePricePerMeter: 180 })).toBe(2250);
  });

  test('fractional result is preserved', () => {
    // 100cm × 3.0 × 1 × 115.5 = 346.5
    expect(calculateCurtainPrice({ enCm: 100, pileOrani: 3.0, kanat: 1, basePricePerMeter: 115.5 })).toBe(346.5);
  });

  // --- invalid inputs return null ---
  test('zero enCm returns null', () => {
    expect(calculateCurtainPrice({ enCm: 0, pileOrani: 2.5, kanat: 1, basePricePerMeter: 230 })).toBeNull();
  });

  test('negative enCm returns null', () => {
    expect(calculateCurtainPrice({ enCm: -100, pileOrani: 2.5, kanat: 1, basePricePerMeter: 230 })).toBeNull();
  });

  test('zero pileOrani returns null', () => {
    expect(calculateCurtainPrice({ enCm: 200, pileOrani: 0, kanat: 1, basePricePerMeter: 230 })).toBeNull();
  });

  test('negative pileOrani returns null', () => {
    expect(calculateCurtainPrice({ enCm: 200, pileOrani: -2.5, kanat: 1, basePricePerMeter: 230 })).toBeNull();
  });

  test('zero kanat returns null', () => {
    expect(calculateCurtainPrice({ enCm: 200, pileOrani: 2.5, kanat: 0, basePricePerMeter: 230 })).toBeNull();
  });

  test('negative kanat returns null', () => {
    expect(calculateCurtainPrice({ enCm: 200, pileOrani: 2.5, kanat: -1, basePricePerMeter: 230 })).toBeNull();
  });

  test('zero basePricePerMeter returns null', () => {
    expect(calculateCurtainPrice({ enCm: 200, pileOrani: 2.5, kanat: 1, basePricePerMeter: 0 })).toBeNull();
  });

  test('negative basePricePerMeter returns null', () => {
    expect(calculateCurtainPrice({ enCm: 200, pileOrani: 2.5, kanat: 1, basePricePerMeter: -1 })).toBeNull();
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
    en:        props._en         ? { value: props._en }         : null,
    pileOrani: props._pile_orani ? { value: props._pile_orani } : null,
    kanat:     props._kanat      ? { value: props._kanat }      : null,
    cost: { amountPerQuantity: { amount: basePricePerMeter, currencyCode: 'TRY' } },
  };
}

function makeLineWithId(id: string, props: LineProps, basePricePerMeter = '230.00') {
  return { ...makeLine(props, basePricePerMeter), id };
}

describe('run', () => {
  // --- happy path ---
  test('returns expand operation for valid curtain line', () => {
    const result = run({
      cart: { lines: [makeLine({ _en: '200', _pile_orani: '2.5', _kanat: '1' })] },
    });
    expect(result.operations).toHaveLength(1);
    const item = result.operations[0].expand.expandedCartItems[0];
    expect(item.price.adjustment.fixedPricePerUnit.amount).toBe('1150.00');
  });

  test('price formatted to 2 decimal places', () => {
    const result = run({
      cart: { lines: [makeLine({ _en: '150', _pile_orani: '2.5', _kanat: '1' })] },
    });
    expect(result.operations[0].expand.expandedCartItems[0].price.adjustment.fixedPricePerUnit.amount).toBe('862.50');
  });

  test('all three valid pileOrani values work (2.0, 2.5, 3.0)', () => {
    for (const pileOrani of ['2.0', '2.5', '3.0']) {
      const result = run({
        cart: { lines: [makeLine({ _en: '200', _pile_orani: pileOrani, _kanat: '1' })] },
      });
      expect(result.operations).toHaveLength(1);
    }
  });

  test('kanat = 2 doubles the price', () => {
    const single = run({ cart: { lines: [makeLine({ _en: '200', _pile_orani: '2.5', _kanat: '1' })] } });
    const double = run({ cart: { lines: [makeLine({ _en: '200', _pile_orani: '2.5', _kanat: '2' })] } });
    const singlePrice = parseFloat(single.operations[0].expand.expandedCartItems[0].price.adjustment.fixedPricePerUnit.amount);
    const doublePrice = parseFloat(double.operations[0].expand.expandedCartItems[0].price.adjustment.fixedPricePerUnit.amount);
    expect(doublePrice).toBe(singlePrice * 2);
  });

  test('quantity is preserved in expandedCartItems', () => {
    const line = { ...makeLine({ _en: '200', _pile_orani: '2.5', _kanat: '1' }), quantity: 3 };
    const result = run({ cart: { lines: [line] } });
    expect(result.operations[0].expand.expandedCartItems[0].quantity).toBe(3);
  });

  test('two curtain lines both get expand operations', () => {
    const result = run({
      cart: {
        lines: [
          makeLineWithId('gid://shopify/CartLine/1', { _en: '200', _pile_orani: '2.5', _kanat: '1' }),
          makeLineWithId('gid://shopify/CartLine/2', { _en: '150', _pile_orani: '3.0', _kanat: '2' }),
        ],
      },
    });
    expect(result.operations).toHaveLength(2);
    expect(result.operations[0].expand.cartLineId).toBe('gid://shopify/CartLine/1');
    expect(result.operations[1].expand.cartLineId).toBe('gid://shopify/CartLine/2');
  });

  test('curtain line id and merchandise id passed through correctly', () => {
    const result = run({
      cart: { lines: [makeLine({ _en: '200', _pile_orani: '2.0', _kanat: '2' })] },
    });
    expect(result.operations[0].expand.cartLineId).toBe('gid://shopify/CartLine/1');
    expect(result.operations[0].expand.expandedCartItems[0].merchandiseId).toBe('gid://shopify/ProductVariant/123');
  });

  // --- skipped lines ---
  test('skips line without any curtain properties', () => {
    const result = run({ cart: { lines: [makeLine({})] } });
    expect(result.operations).toHaveLength(0);
  });

  test('skips line missing _pile_orani only', () => {
    const result = run({
      cart: { lines: [makeLine({ _en: '200', _kanat: '1' })] },
    });
    expect(result.operations).toHaveLength(0);
  });

  test('skips line missing _kanat only', () => {
    const result = run({
      cart: { lines: [makeLine({ _en: '200', _pile_orani: '2.5' })] },
    });
    expect(result.operations).toHaveLength(0);
  });

  test('skips line missing _en only', () => {
    const result = run({
      cart: { lines: [makeLine({ _pile_orani: '2.5', _kanat: '1' })] },
    });
    expect(result.operations).toHaveLength(0);
  });

  test('skips line with zero _en', () => {
    const result = run({
      cart: { lines: [makeLine({ _en: '0', _pile_orani: '2.5', _kanat: '1' })] },
    });
    expect(result.operations).toHaveLength(0);
  });

  test('skips line with non-numeric _en', () => {
    const result = run({
      cart: { lines: [makeLine({ _en: 'abc', _pile_orani: '2.5', _kanat: '1' })] },
    });
    expect(result.operations).toHaveLength(0);
  });

  test('skips line with non-numeric _pile_orani', () => {
    const result = run({
      cart: { lines: [makeLine({ _en: '200', _pile_orani: 'abc', _kanat: '1' })] },
    });
    expect(result.operations).toHaveLength(0);
  });

  // --- mixed cart ---
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

  test('empty cart returns no operations', () => {
    const result = run({ cart: { lines: [] } });
    expect(result.operations).toHaveLength(0);
  });
});
