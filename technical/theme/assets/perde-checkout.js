(function () {
  'use strict';

  var API_URL = window.PERDE_API_URL || '';

  function log(msg, data) {
    if (data !== undefined) {
      console.log('[PerdeCheckout] ' + msg, data);
    } else {
      console.log('[PerdeCheckout] ' + msg);
    }
  }

  document.addEventListener('click', function (e) {
    var target = e.target.closest(
      'a[href*="/checkout"], button[name="checkout"], input[name="checkout"], a[href*="checkouts"]'
    );
    if (!target) return;

    // Don't intercept if we have no API configured
    if (!API_URL) {
      log('no API_URL — falling through to normal checkout');
      return;
    }

    // Prevent default navigation while we query the server
    e.preventDefault();
    e.stopImmediatePropagation();

    var originalText = target.textContent;
    var originalHref = target.href || '/checkout';
    target.disabled = true;
    if (target.tagName === 'A' || target.tagName === 'BUTTON') {
      target.textContent = 'Hazırlanıyor…';
    }

    log('intercepted checkout click');

    // Step 1: get cart token
    fetch('/cart.js')
      .then(function (res) { return res.json(); })
      .then(function (cart) {
        if (!cart || !cart.item_count || cart.item_count === 0) {
          log('cart empty — falling through');
          window.location.href = originalHref;
          return;
        }

        var cartToken = cart.token;
        if (!cartToken) {
          log('no cart token — falling through');
          window.location.href = originalHref;
          return;
        }

        log('cart token obtained', { token: cartToken, items: cart.item_count });

        // Step 2: ask server for draft order checkout URL
        return fetch(API_URL + '/api/checkout/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartToken: cartToken })
        })
          .then(function (res) {
            if (res.status === 404) {
              // No configured items in DB — fall through to normal Shopify checkout
              log('NO_ITEMS from server — falling through to normal checkout');
              window.location.href = originalHref;
              return;
            }
            if (!res.ok) {
              log('server error — falling through', { status: res.status });
              window.location.href = originalHref;
              return;
            }
            return res.json().then(function (data) {
              if (data && data.checkoutUrl) {
                log('redirecting to draft order checkout', { url: data.checkoutUrl.substring(0, 60) });
                window.location.href = data.checkoutUrl;
              } else {
                log('no checkoutUrl in response — falling through');
                window.location.href = originalHref;
              }
            });
          });
      })
      .catch(function (err) {
        log('error — falling through', { error: err.message });
        // Restore button and fall through to normal checkout
        target.disabled = false;
        if (target.tagName === 'A' || target.tagName === 'BUTTON') {
          target.textContent = originalText;
        }
        window.location.href = originalHref;
      });
  }, true); // capture phase — fires before any other click handlers

  log('loaded', { apiUrl: API_URL ? API_URL : 'NOT SET' });
})();
