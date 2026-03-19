/**
 * perde-cart-total.js
 *
 * Overrides the Horizon cart drawer total to reflect the correct
 * configured price for custom curtain items. Shopify's cart always
 * sums base variant prices; this script reads `_hesaplanan_cents`
 * from line item properties and recalculates the true total.
 *
 * Works by:
 *  1. Fetching /cart.js on every cart change to get real property data
 *  2. Patching text-component[data-testid="cart-total-value"]
 *  3. Re-patching after every AJAX re-render via MutationObserver
 *  4. Listening for cart:update events dispatched by the configurator
 */
(function () {
  'use strict';

  var PROP_KEY = '_hesaplanan_cents';
  var _applying = false;   // true only during synchronous DOM writes — suppresses observer
  var _scheduled = false;  // debounce flag
  var _timer = null;
  var _lastFormatted = null; // last value we wrote, so we can skip our own mutations

  /* ── Formatting ─────────────────────────────────────────── */

  function formatTL(cents) {
    return (cents / 100).toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' TL';
  }

  /* ── Calculate correct total from /cart.js ──────────────── */

  function fetchCorrectTotal() {
    return fetch('/cart.js')
      .then(function (r) { return r.json(); })
      .then(function (cart) {
        // If no item has _hesaplanan_cents, nothing to override
        var hasConfigured = cart.items.some(function (item) {
          return item.properties && item.properties[PROP_KEY];
        });
        if (!hasConfigured) return null;

        var total = 0;
        cart.items.forEach(function (item) {
          var configured = item.properties && item.properties[PROP_KEY];
          if (configured) {
            total += parseInt(configured, 10) * item.quantity;
          } else {
            total += item.final_line_price;
          }
        });
        return total;
      })
      .catch(function () { return null; });
  }

  /* ── Patch the DOM ──────────────────────────────────────── */

  function patchDOM(formatted) {
    _applying = true;
    try {
      // 1. Main total: text-component custom element
      //    Has both `value` attribute and text content; Horizon reads `value`
      var totalEl = document.querySelector('[data-testid="cart-total-value"]');
      if (totalEl) {
        totalEl.setAttribute('value', formatted);
        // Only replace the text node to avoid touching child elements
        var nodes = Array.from(totalEl.childNodes);
        var textNode = nodes.find(function (n) { return n.nodeType === 3; });
        if (textNode) {
          textNode.nodeValue = ' ' + formatted + ' ';
        } else {
          totalEl.textContent = formatted;
        }
      }

      // 2. Accessible table caption: <caption class="visually-hidden"><span>…</span></caption>
      //    Horizon duplicates the total here for screen readers
      var captionSpan = document.querySelector('caption.visually-hidden span');
      if (captionSpan) {
        captionSpan.textContent = formatted;
      }

      // 3. Full caption text: "Sepet toplamı 580.00 TRY"
      var caption = document.querySelector('caption.visually-hidden');
      if (caption && !captionSpan) {
        // Fallback if no child span
        caption.textContent = caption.textContent.replace(/[\d\s.,]+TRY|[\d\s.,]+TL/, formatted);
      }

    } finally {
      _applying = false;
    }

    _lastFormatted = formatted;
    console.log('[PerdeCartTotal] patched total →', formatted);
  }

  /* ── Main entry point ───────────────────────────────────── */

  function runPatch() {
    fetchCorrectTotal().then(function (total) {
      if (total === null) return;
      var formatted = formatTL(total);
      if (formatted === _lastFormatted) return; // already correct
      patchDOM(formatted);
    });
  }

  /* ── Debounced scheduler ────────────────────────────────── */

  function schedule(delay) {
    clearTimeout(_timer);
    _timer = setTimeout(function () {
      _scheduled = false;
      runPatch();
    }, delay || 120);
    _scheduled = true;
  }

  /* ── Event listeners ────────────────────────────────────── */

  // Fired by curtain-configurator.liquid after add-to-cart
  document.addEventListener('cart:update', function () { schedule(200); });
  // Horizon sometimes fires this on cart refresh
  document.addEventListener('cart:refresh', function () { schedule(200); });

  /* ── MutationObserver ───────────────────────────────────── */
  // Re-patch whenever Horizon re-renders the cart drawer via sections API.
  // The whole drawer HTML is replaced on quantity changes, item removal, etc.

  var _obs = new MutationObserver(function (mutations) {
    if (_applying) return; // our own write — skip

    for (var i = 0; i < mutations.length; i++) {
      var m = mutations[i];

      if (m.type === 'characterData') {
        // Text node changed inside the total element — check if it's ours
        var parent = m.target.parentElement;
        if (parent && parent.closest && parent.closest('[data-testid="cart-total-value"]')) {
          var val = m.target.nodeValue && m.target.nodeValue.trim();
          if (val && val !== _lastFormatted) {
            // Shopify wrote a new value — re-patch
            schedule(50);
          }
        }
        continue;
      }

      if (m.type === 'childList' && m.addedNodes.length > 0) {
        for (var j = 0; j < m.addedNodes.length; j++) {
          var node = m.addedNodes[j];
          if (node.nodeType !== 1) continue;
          // A new subtree was injected — check if it contains the total element
          if (node.querySelector && node.querySelector('[data-testid="cart-total-value"]')) {
            schedule(50);
            return;
          }
          if (node.dataset && node.dataset.testid === 'cart-total-value') {
            schedule(50);
            return;
          }
        }
        // Check if mutation happened inside the cart totals area
        if (m.target.classList && (
          m.target.classList.contains('cart-totals') ||
          m.target.classList.contains('cart-totals__total') ||
          m.target.classList.contains('cart-actions')
        )) {
          schedule(50);
          return;
        }
      }
    }
  });

  /* ── Initialise ─────────────────────────────────────────── */

  function init() {
    var cartDrawer = document.querySelector('cart-drawer-component');
    var cartPage = document.querySelector('cart-items-component');
    var target = cartDrawer || cartPage;

    if (!target) {
      // Neither element found yet — retry (e.g. deferred render)
      setTimeout(init, 500);
      return;
    }

    if (cartPage && !cartDrawer) {
      console.log('[PerdeCartTotal] running on cart page, observing cart-items-component');
    }

    _obs.observe(target, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Run once on page load in case cart has items
    runPatch();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
