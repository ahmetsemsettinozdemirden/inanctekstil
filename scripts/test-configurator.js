/**
 * Perde Tasarla Configurator — Browser Test Suite
 *
 * Run via Playwright browser_evaluate (paste the whole file content).
 * Requires the product page to be loaded with ?preview_theme_id=...
 *
 * Usage:
 *   const script = require('fs').readFileSync('scripts/test-configurator.js', 'utf8');
 *   const results = await page.evaluate(script);
 *   console.log(results);
 */

(async function perdeTests() {
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ─── Helpers ────────────────────────────────────────────────────────────────

  function getConfEl() {
    return document.getElementById('curtain-configurator');
  }

  function getBasePrice() {
    const el = getConfEl();
    return el ? parseFloat(el.dataset.basePrice) : null;
  }

  function resetConfigurator() {
    // Reset all steps to initial state
    window.perdeConfig = {};
    const step1 = document.getElementById('perde-step-1');
    const step2 = document.getElementById('perde-step-2');
    const step3 = document.getElementById('perde-step-3');
    const step4 = document.getElementById('perde-step-4');
    [step1, step2, step3, step4].forEach(el => { if (el) el.classList.remove('is-active'); });
    if (step1) step1.classList.add('is-active');

    ['perde-summary-1','perde-summary-2','perde-summary-3'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('is-visible');
    });

    const enIn = document.getElementById('perde-en');
    const boyIn = document.getElementById('perde-boy');
    if (enIn) { enIn.value = ''; enIn.classList.remove('is-invalid'); }
    if (boyIn) { boyIn.value = ''; boyIn.classList.remove('is-invalid'); }

    document.querySelectorAll('.perde-conf__pile-card').forEach(c => {
      c.classList.remove('is-selected'); c.setAttribute('aria-pressed','false');
    });
    document.querySelectorAll('.perde-conf__kanat-option').forEach(o => {
      o.classList.remove('is-selected'); o.setAttribute('aria-pressed','false');
    });

    const step1Btn = document.getElementById('perde-step1-btn');
    const step2Btn = document.getElementById('perde-step2-btn');
    const step3Btn = document.getElementById('perde-step3-btn');
    const addBtn   = document.getElementById('perde-add-to-cart-btn');
    const cb       = document.getElementById('perde-disclaimer-check');
    if (step1Btn) step1Btn.disabled = true;
    if (step2Btn) step2Btn.disabled = true;
    if (step3Btn) step3Btn.disabled = true;
    if (addBtn)   { addBtn.disabled = true; addBtn.textContent = 'Sepete Ekle'; }
    if (cb)       cb.checked = false;

    const errEl = document.getElementById('perde-cart-error');
    if (errEl) errEl.classList.remove('is-visible');
  }

  function setInput(id, value) {
    const el = document.getElementById(id);
    if (!el) return false;
    el.value = String(value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function clickPile(pileName) {
    const card = document.querySelector('[data-pile="' + pileName + '"]');
    if (!card) return false;
    card.click();
    return true;
  }

  function clickKanat(kanatName) {
    const opt = document.querySelector('[data-kanat="' + kanatName + '"]');
    if (!opt) return false;
    opt.click();
    return true;
  }

  function clickBtn(id) {
    const btn = document.getElementById(id);
    if (!btn || btn.disabled) return false;
    btn.click();
    return true;
  }

  function getPriceDisplay() {
    const el = document.getElementById('perde-price-display');
    return el ? el.textContent.trim() : null;
  }

  function isStep4Visible() {
    const el = document.getElementById('perde-step-4');
    return el ? el.classList.contains('is-active') : false;
  }

  function isStep1BtnEnabled() {
    const btn = document.getElementById('perde-step1-btn');
    return btn ? !btn.disabled : false;
  }

  function isEnInvalid() {
    const el = document.getElementById('perde-en');
    return el ? el.classList.contains('is-invalid') : false;
  }

  function isBoyInvalid() {
    const el = document.getElementById('perde-boy');
    return el ? el.classList.contains('is-invalid') : false;
  }

  // Format matching Shopify's {{ money }} filter output: "1,150.00TL" (en-US separators, no space)
  function shopifyMoney(en, pileRatio, kanatCount, basePrice) {
    const raw = (en / 100) * pileRatio * kanatCount * basePrice;
    return raw.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + 'TL';
  }

  // Format matching configurator price display (tr-TR locale): "1.150,00 TL"
  function expectedPrice(en, pileRatio, kanatCount, basePrice) {
    const raw = (en / 100) * pileRatio * kanatCount * basePrice;
    return raw.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
  }

  async function navigateToStep4(en, boy, pile, kanat) {
    resetConfigurator();
    await sleep(100);
    setInput('perde-en', en);
    setInput('perde-boy', boy);
    await sleep(50);
    if (!clickBtn('perde-step1-btn')) return false;
    await sleep(200);
    if (!clickPile(pile)) return false;
    if (!clickBtn('perde-step2-btn')) return false;
    await sleep(200);
    if (!clickKanat(kanat)) return false;
    if (!clickBtn('perde-step3-btn')) return false;
    await sleep(200);
    return isStep4Visible();
  }

  async function addToCartAndGetState(en, boy, pile, kanat) {
    const reached = await navigateToStep4(en, boy, pile, kanat);
    if (!reached) return { error: 'Could not reach step 4' };

    const cb = document.getElementById('perde-disclaimer-check');
    if (cb && !cb.checked) cb.click();
    await sleep(100);

    const addBtn = document.getElementById('perde-add-to-cart-btn');
    if (!addBtn || addBtn.disabled) return { error: 'Add button disabled' };
    addBtn.click();
    await sleep(3000);

    const cartRes = await fetch('/cart.js').then(r => r.json());
    const item = cartRes.items && cartRes.items[0];
    if (!item) return { error: 'No item in cart' };

    const drawer = document.querySelector('cart-drawer-component');
    const unitEl = drawer && drawer.querySelector('.cart-items__unit-price-wrapper span:not(.visually-hidden)');
    const lineEl = drawer && drawer.querySelector('.cart-items__price text-component');
    const totalEl = drawer && drawer.querySelector('.cart-totals__total-value');

    return {
      btnText: addBtn.textContent.trim(),
      cartItemCount: cartRes.item_count,
      properties: item.properties,
      hesaplananCents: item.properties['_hesaplanan_cents'],
      finalLinePrice: item.final_line_price,
      cartUnitPrice: unitEl ? unitEl.textContent.trim() : null,
      cartLinePrice: lineEl ? lineEl.getAttribute('value') : null,
      cartTotal: totalEl ? totalEl.getAttribute('value') : null,
    };
  }

  // ─── Test Runner ────────────────────────────────────────────────────────────

  const results = [];
  let passed = 0, failed = 0;

  function assert(id, description, actual, expected) {
    const ok = actual === expected;
    results.push({
      id,
      description,
      status: ok ? 'PASS' : 'FAIL',
      expected,
      actual: ok ? undefined : actual
    });
    if (ok) passed++; else failed++;
    return ok;
  }

  function assertContains(id, description, actual, needle) {
    const ok = typeof actual === 'string' && actual.includes(needle);
    results.push({
      id,
      description,
      status: ok ? 'PASS' : 'FAIL',
      expected: 'contains "' + needle + '"',
      actual: ok ? undefined : actual
    });
    if (ok) passed++; else failed++;
    return ok;
  }

  function assertNotNull(id, description, actual) {
    const ok = actual !== null && actual !== undefined && actual !== '';
    results.push({
      id,
      description,
      status: ok ? 'PASS' : 'FAIL',
      expected: 'non-null value',
      actual: ok ? undefined : actual
    });
    if (ok) passed++; else failed++;
    return ok;
  }

  const BASE = getBasePrice();
  if (!BASE) {
    return { error: 'Not on a perde-tasarla product page, or base price is 0', results: [] };
  }

  // ── TC-001 to TC-006: Price formula — all pile × kanat combos ───────────────
  const pileCases = [
    { pile: 'Düz Dikiş',  ratio: 2.0 },
    { pile: 'Kanun Pile', ratio: 2.5 },
    { pile: 'Boru Pile',  ratio: 3.0 }
  ];
  const kanatCases = [
    { kanat: 'Tek Kanat',  count: 1 },
    { kanat: 'Çift Kanat', count: 2 }
  ];

  let tcNum = 1;
  for (const p of pileCases) {
    for (const k of kanatCases) {
      const id  = 'TC-' + String(tcNum).padStart(3, '0');
      const en  = 200, boy = 250;
      const exp = expectedPrice(en, p.ratio, k.count, BASE);
      const reached = await navigateToStep4(en, boy, p.pile, k.kanat);
      assert(id, p.pile + ' + ' + k.kanat + ' (200×250) step4 reached', reached, true);
      if (reached) {
        const actual = getPriceDisplay();
        assert(id + 'p', p.pile + ' + ' + k.kanat + ' price = ' + exp, actual, exp);
      }
      tcNum++;
    }
  }

  // ── TC-007: Min width (50cm) price ──────────────────────────────────────────
  {
    const id  = 'TC-007';
    const exp = expectedPrice(50, 2.5, 1, BASE);
    const reached = await navigateToStep4(50, 100, 'Kanun Pile', 'Tek Kanat');
    assert(id, 'Min width 50cm reaches step4', reached, true);
    if (reached) assert(id + 'p', 'Min width 50cm price = ' + exp, getPriceDisplay(), exp);
  }

  // ── TC-008: Large width (300cm) + Çift Kanat ────────────────────────────────
  {
    const id  = 'TC-008';
    const exp = expectedPrice(300, 3.0, 2, BASE);
    const maxBoy = parseInt(document.getElementById('curtain-configurator').dataset.maxBoy) || 300;
    const reached = await navigateToStep4(300, maxBoy, 'Boru Pile', 'Çift Kanat');
    assert(id, '300cm wide + Boru Pile + Çift Kanat reaches step4', reached, true);
    if (reached) assert(id + 'p', '300cm wide price = ' + exp, getPriceDisplay(), exp);
  }

  // ── TC-009: Validation — En below minimum (49) ──────────────────────────────
  {
    resetConfigurator();
    await sleep(100);
    setInput('perde-en', 49);
    setInput('perde-boy', 200);
    await sleep(50);
    assert('TC-009', 'En=49 → step1 btn disabled', isStep1BtnEnabled(), false);
    assert('TC-009v', 'En=49 → en input marked invalid', isEnInvalid(), true);
  }

  // ── TC-010: Validation — En at minimum (50) ─────────────────────────────────
  {
    resetConfigurator();
    await sleep(100);
    setInput('perde-en', 50);
    setInput('perde-boy', 200);
    await sleep(50);
    assert('TC-010', 'En=50 → step1 btn enabled', isStep1BtnEnabled(), true);
    assert('TC-010v', 'En=50 → en input NOT invalid', isEnInvalid(), false);
  }

  // ── TC-011: Validation — Boy above max ──────────────────────────────────────
  {
    const maxBoy = parseInt(document.getElementById('curtain-configurator').dataset.maxBoy) || 300;
    resetConfigurator();
    await sleep(100);
    setInput('perde-en', 150);
    setInput('perde-boy', maxBoy + 1);
    await sleep(50);
    assert('TC-011', 'Boy=' + (maxBoy+1) + ' → step1 btn disabled', isStep1BtnEnabled(), false);
    assert('TC-011v', 'Boy=' + (maxBoy+1) + ' → boy input marked invalid', isBoyInvalid(), true);
  }

  // ── TC-012: Validation — Boy at max ─────────────────────────────────────────
  {
    const maxBoy = parseInt(document.getElementById('curtain-configurator').dataset.maxBoy) || 300;
    resetConfigurator();
    await sleep(100);
    setInput('perde-en', 150);
    setInput('perde-boy', maxBoy);
    await sleep(50);
    assert('TC-012', 'Boy=' + maxBoy + ' (max) → step1 btn enabled', isStep1BtnEnabled(), true);
    assert('TC-012v', 'Boy=' + maxBoy + ' → boy input NOT invalid', isBoyInvalid(), false);
  }

  // ── TC-013: Validation — Boy=0 ──────────────────────────────────────────────
  {
    resetConfigurator();
    await sleep(100);
    setInput('perde-en', 150);
    setInput('perde-boy', 0);
    await sleep(50);
    assert('TC-013', 'Boy=0 → step1 btn disabled', isStep1BtnEnabled(), false);
  }

  // ── TC-014: Cart properties after add — Kanun Pile + Tek Kanat ──────────────
  {
    await fetch('/cart/clear.js', { method: 'POST' });
    await sleep(300);
    const state = await addToCartAndGetState(200, 250, 'Kanun Pile', 'Tek Kanat');
    const expCents = Math.round((200/100) * 2.5 * 1 * BASE * 100);
    assert('TC-014a', 'Cart add btn shows ✓', state.btnText, 'Sepete Eklendi ✓');
    assert('TC-014b', 'Cart item count = 1', state.cartItemCount, 1);
    assertNotNull('TC-014c', '_hesaplanan_cents present in properties', state.hesaplananCents);
    assert('TC-014d', '_hesaplanan_cents = ' + expCents, Number(state.hesaplananCents), expCents);
    assertContains('TC-014e', 'En property present', state.properties && state.properties['En'], '200');
    assertContains('TC-014f', 'Boy property present', state.properties && state.properties['Boy'], '250');
    assertContains('TC-014g', 'Pile Stili property present', state.properties && state.properties['Pile Stili'], 'Kanun Pile');
    assert('TC-014h', 'Kanat property = Tek Kanat', state.properties && state.properties['Kanat'], 'Tek Kanat');
  }

  // ── TC-015: Cart display — unit price, line price, total all correct ─────────
  {
    // Cart from TC-014 still has the item
    // Shopify {{ money }} filter format: "1,150.00TL" (en-US separators, no space before TL)
    const expShopify = shopifyMoney(200, 2.5, 1, BASE);
    // Numeric portion for total check (total may show TRY or TL suffix)
    const expNumeric = expShopify.replace('TL', '');

    const drawer = document.querySelector('cart-drawer-component');
    if (drawer) drawer.open();
    await sleep(500);

    const unitEl  = drawer && drawer.querySelector('.cart-items__unit-price-wrapper span:not(.visually-hidden)');
    const lineEl  = drawer && drawer.querySelector('.cart-items__price text-component');
    const totalEl = drawer && drawer.querySelector('.cart-totals__total-value');

    const cartUnitPrice = unitEl ? unitEl.textContent.trim() : null;
    const cartLinePrice = lineEl ? lineEl.getAttribute('value') : null;
    const cartTotal     = totalEl ? totalEl.getAttribute('value') : null;

    assert('TC-015a', 'Cart drawer unit price = ' + expShopify, cartUnitPrice, expShopify);
    assert('TC-015b', 'Cart drawer line price = ' + expShopify, cartLinePrice, expShopify);
    assertContains('TC-015c', 'Cart drawer total contains ' + expNumeric, cartTotal, expNumeric);
  }

  // ── TC-016: Çift Kanat cart properties ──────────────────────────────────────
  {
    await fetch('/cart/clear.js', { method: 'POST' });
    await sleep(300);
    const state = await addToCartAndGetState(150, 200, 'Boru Pile', 'Çift Kanat');
    const expCents = Math.round((150/100) * 3.0 * 2 * BASE * 100);
    assert('TC-016a', 'Boru Pile + Çift Kanat: _hesaplanan_cents = ' + expCents,
           Number(state.hesaplananCents), expCents);
    assert('TC-016b', 'Kanat = Çift Kanat', state.properties && state.properties['Kanat'], 'Çift Kanat');
  }

  // ── TC-017: Disclaimer checkbox gates add button ─────────────────────────────
  {
    resetConfigurator();
    await sleep(100);
    setInput('perde-en', 200);
    setInput('perde-boy', 250);
    await sleep(50);
    clickBtn('perde-step1-btn');
    await sleep(200);
    clickPile('Kanun Pile');
    clickBtn('perde-step2-btn');
    await sleep(200);
    clickKanat('Tek Kanat');
    clickBtn('perde-step3-btn');
    await sleep(200);
    // Disclaimer NOT checked → button disabled
    const btnBeforeCheck = document.getElementById('perde-add-to-cart-btn');
    assert('TC-017a', 'Add btn disabled before disclaimer check', btnBeforeCheck ? btnBeforeCheck.disabled : null, true);
    // Check disclaimer
    const cb = document.getElementById('perde-disclaimer-check');
    if (cb) cb.click();
    await sleep(50);
    const btnAfterCheck = document.getElementById('perde-add-to-cart-btn');
    assert('TC-017b', 'Add btn enabled after disclaimer check', btnAfterCheck ? btnAfterCheck.disabled : null, false);
    // Uncheck → disabled again
    if (cb) cb.click();
    await sleep(50);
    assert('TC-017c', 'Add btn disabled after uncheck', btnAfterCheck ? btnAfterCheck.disabled : null, true);
  }

  // ── TC-018: Configurator hidden on non-perde-tasarla products ────────────────
  // (Can only verify it exists on this page since we ARE on a perde-tasarla product)
  {
    const confEl = getConfEl();
    assertNotNull('TC-018', 'Configurator rendered on perde-tasarla product', confEl);
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  const summary = {
    total: passed + failed,
    passed,
    failed,
    basePrice: BASE,
    results
  };

  console.log('\n[PerdeTasarla Tests]', passed + '/' + (passed + failed), 'passed');
  results.forEach(r => {
    const prefix = r.status === 'PASS' ? '✓' : '✗';
    const suffix = r.status === 'FAIL' ? ' (expected: ' + r.expected + ', got: ' + r.actual + ')' : '';
    console.log('  ' + prefix + ' ' + r.id + ': ' + r.description + suffix);
  });

  return summary;
})();
