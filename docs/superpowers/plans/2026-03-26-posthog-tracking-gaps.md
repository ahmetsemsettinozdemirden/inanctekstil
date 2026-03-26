# PostHog Tracking Gaps — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close five PostHog tracking gaps — customer identity, checkout started, order completed, UTM attribution, and test account filtering — so ad campaign impact is fully measurable end-to-end.

**Architecture:** All code changes are confined to three files: `posthog-analytics.liquid` (identity), `perde-checkout.js` (checkout event), and a new Shopify Additional Scripts block (order completed). UTM and test account filter are configuration-only steps with no code.

**Tech Stack:** Shopify Liquid, vanilla JS, PostHog JS SDK (already loaded via stub queue), Shopify CLI for push/preview.

---

## File Map

| File | Change |
|------|--------|
| `technical/theme/snippets/posthog-analytics.liquid` | Add `posthog.identify()` when `customer` is present |
| `technical/theme/assets/perde-checkout.js` | Add `checkout_started` capture before redirect |
| Shopify Admin → Settings → Checkout → Additional scripts | New block: PostHog init + `order_completed` capture |
| Meta Ads Manager → Ad URLs | Add UTM query params to landing page URLs |
| PostHog → Settings → Project → Filter test accounts | Add email rule for test users |

---

## Task 1: Customer Identity (`posthog.identify`)

Identify logged-in Shopify customers so sessions are linked to a person record, enabling test account filtering and cross-session stitching.

**Files:**
- Modify: `technical/theme/snippets/posthog-analytics.liquid`

- [ ] **Step 1: Read the current file**

Confirm current content of `posthog-analytics.liquid` ends at line 31 with no existing `identify` call.

- [ ] **Step 2: Add identify call after `posthog.init()`**

In `technical/theme/snippets/posthog-analytics.liquid`, insert the block immediately after the closing `});` of `posthog.init(...)` (after line 14, before line 16):

```liquid
{% comment %}PostHog Analytics — loaded on every page via theme.liquid{% endcomment %}
<script>
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(a!==void 0?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+" (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  posthog.init('phc_knhZGJSkRM7w0MmIssVXa7U6QzDiGipYDXu4xwyflQp', {
    api_host: 'https://svc.inanctekstil.store',
    ui_host: 'https://eu.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    session_recording: { maskAllInputs: true },
    persistence: 'localStorage+cookie',
    enable_heatmaps: true,
    opt_out_capturing_by_default: false
  });

  {% if customer %}
  posthog.identify({{ customer.id | json }}, {
    email: {{ customer.email | json }},
    name: {{ customer.first_name | append: ' ' | append: customer.last_name | strip | json }}
  });
  {% endif %}

  {% if request.page_type == 'product' %}
  posthog.capture('product_viewed', {
    product_id: {{ product.id | json }},
    product_name: {{ product.title | json }},
    price: {{ product.price | divided_by: 100.0 }},
    category: {{ product.collections.first.title | default: '' | json }}
  });
  {% endif %}

  {% if request.page_type == 'collection' %}
  posthog.capture('category_viewed', {
    category_name: {{ collection.title | json }},
    category_handle: {{ collection.handle | json }}
  });
  {% endif %}
</script>
```

- [ ] **Step 3: Push to draft theme and preview**

```bash
shopify theme push --theme 193719566417 --store 1z7hb1-2d.myshopify.com \
  --only "snippets/posthog-analytics.liquid" --nodelete --path technical/theme
```

Preview at: `https://inanctekstil.store/?preview_theme_id=193719566417`

Log in to the store with `info@inanctekstil.store`. Open browser DevTools → Console and run:

```js
posthog.get_distinct_id()
```

Expected output: `"customer_1"` (the Shopify customer ID as a string, not a random UUID).

Also run:
```js
posthog.get_property('email')
```

Expected: `"info@inanctekstil.store"`

- [ ] **Step 4: Verify in PostHog**

Run this HogQL query in PostHog (Explore → SQL):

```sql
SELECT distinct_id, properties.$email, timestamp
FROM events
WHERE event = '$identify'
  AND timestamp > now() - INTERVAL 10 MINUTE
ORDER BY timestamp DESC
LIMIT 5
```

Expected: a row with your Shopify customer ID as `distinct_id` and `info@inanctekstil.store` as `$email`.

- [ ] **Step 5: Push to production**

```bash
shopify theme push --theme 193714913361 --store 1z7hb1-2d.myshopify.com \
  --only "snippets/posthog-analytics.liquid" --nodelete --path technical/theme
```

- [ ] **Step 6: Commit**

```bash
git add technical/theme/snippets/posthog-analytics.liquid
git commit -m "feat(analytics): identify logged-in Shopify customer in PostHog"
```

---

## Task 2: Filter Test Accounts in PostHog

Configure PostHog to exclude your sessions from all charts with a single toggle.

**Files:**
- Config only: PostHog → Settings → Project → Filter test accounts

- [ ] **Step 1: Open PostHog project settings**

Go to: `https://eu.posthog.com/project/141609/settings/project#test-account-filters`

- [ ] **Step 2: Add the filter rule**

Click "Add filter" and set:

| Field | Value |
|-------|-------|
| Property | `email` |
| Operator | `contains` |
| Value | `inanctekstil.store` |

This catches `info@inanctekstil.store` and any other store accounts.

Click **Save**.

- [ ] **Step 3: Verify the filter works**

Open any insight in PostHog (e.g. Trends → Unique visitors for today). Toggle "Filter test accounts" ON and OFF. The count for today should drop by at least 1 when ON (your own browsing session).

**Note:** This filter only works reliably after Task 1 is deployed, since PostHog needs to know your email to filter you out.

---

## Task 3: Checkout Started Event (`checkout_started`)

Fire a PostHog event in `perde-checkout.js` the moment a user is redirected to the draft order checkout URL. This captures everyone who reaches the payment page.

**Files:**
- Modify: `technical/theme/assets/perde-checkout.js`

- [ ] **Step 1: Locate the redirect point**

In `technical/theme/assets/perde-checkout.js`, find line 77-81:

```js
return res.json().then(function (data) {
  if (data && data.checkoutUrl) {
    log('redirecting to draft order checkout', { url: data.checkoutUrl.substring(0, 60) });
    // Cart is NOT cleared here — it stays intact ...
    window.location.href = data.checkoutUrl;
```

- [ ] **Step 2: Add the capture call before the redirect**

Replace lines 77-82 with:

```js
return res.json().then(function (data) {
  if (data && data.checkoutUrl) {
    log('redirecting to draft order checkout', { url: data.checkoutUrl.substring(0, 60) });
    if (window.posthog) {
      posthog.capture('checkout_started', {
        cart_token: cartToken,
        item_count: cart.item_count
      });
    }
    window.location.href = data.checkoutUrl;
```

- [ ] **Step 3: Push to draft theme and verify**

```bash
shopify theme push --theme 193719566417 --store 1z7hb1-2d.myshopify.com \
  --only "assets/perde-checkout.js" --nodelete --path technical/theme
```

Preview: `https://inanctekstil.store/?preview_theme_id=193719566417`

Add a product to cart via the configurator. Click the checkout button. In DevTools → Network tab, filter by `svc.inanctekstil.store`. Confirm a POST request fires for `checkout_started` before the redirect happens.

Also verify in PostHog with:

```sql
SELECT event, properties.cart_token, properties.item_count, timestamp
FROM events
WHERE event = 'checkout_started'
  AND timestamp > now() - INTERVAL 10 MINUTE
ORDER BY timestamp DESC
LIMIT 5
```

Expected: a row with your cart token and item count.

- [ ] **Step 4: Push to production**

```bash
shopify theme push --theme 193714913361 --store 1z7hb1-2d.myshopify.com \
  --only "assets/perde-checkout.js" --nodelete --path technical/theme
```

- [ ] **Step 5: Commit**

```bash
git add technical/theme/assets/perde-checkout.js
git commit -m "feat(analytics): capture checkout_started event before draft order redirect"
```

---

## Task 4: Order Completed Event (`order_completed`)

Track successful purchases on the Shopify order status page (the "Thank you" page after payment). This page is not rendered by the theme — it requires a script in Shopify Admin → Checkout settings.

**Files:**
- Config: Shopify Admin → Settings → Checkout → Order status page (Additional scripts)

**Important:** The Additional scripts field runs on every visit to the order status page. Use Shopify's `{{ first_time_accessed }}` Liquid variable to fire the event only once per order.

- [ ] **Step 1: Open Shopify checkout settings**

Go to: `https://1z7hb1-2d.myshopify.com/admin/settings/checkout`

Scroll to **"Order status page"** → **"Additional scripts"** textarea.

- [ ] **Step 2: Paste the tracking script**

Paste this into the textarea (append after any existing content, don't replace it):

```liquid
{% if first_time_accessed %}
<script>
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(a!==void 0?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+" (stub)"},o="init capture register register_once register_for_session unregister unregister_for_session getFeatureFlag getFeatureFlagPayload isFeatureEnabled reloadFeatureFlags updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures on onFeatureFlags onSessionId getSurveys getActiveMatchingSurveys renderSurvey canRenderSurvey getNextSurveyStep identify setPersonProperties group resetGroups setPersonPropertiesForFlags resetPersonPropertiesForFlags setGroupPropertiesForFlags resetGroupPropertiesForFlags reset get_distinct_id getGroups get_session_id get_session_replay_url alias set_config startSessionRecording stopSessionRecording sessionRecordingStarted captureException loadToolbar get_property getSessionProperty createPersonProfile opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing clear_opt_in_out_capturing debug".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

  posthog.init('phc_knhZGJSkRM7w0MmIssVXa7U6QzDiGipYDXu4xwyflQp', {
    api_host: 'https://svc.inanctekstil.store',
    ui_host: 'https://eu.posthog.com',
    persistence: 'localStorage+cookie',
    capture_pageview: false,
    autocapture: false
  });

  {% if checkout.customer %}
  posthog.identify({{ checkout.customer.id | json }}, {
    email: {{ checkout.email | json }}
  });
  {% endif %}

  posthog.capture('order_completed', {
    order_id: {{ order.id | json }},
    order_name: {{ order.name | json }},
    total_price: {{ order.total_price | divided_by: 100.0 }},
    currency: {{ order.currency | json }},
    email: {{ checkout.email | json }}
  });
</script>
{% endif %}
```

Click **Save**.

- [ ] **Step 3: Place a test order and verify**

Place a real order through the store (you can use a low-cost test variant or Shopify's test payment gateway if enabled). After landing on the order status page, open DevTools → Network and filter by `svc.inanctekstil.store`. Confirm a POST for `order_completed` fires.

Then verify in PostHog:

```sql
SELECT event, properties.order_id, properties.order_name, properties.total_price, timestamp
FROM events
WHERE event = 'order_completed'
  AND timestamp > now() - INTERVAL 30 MINUTE
ORDER BY timestamp DESC
LIMIT 5
```

Expected: a row with the order ID, order name (e.g. `#1001`), and total price.

**Note:** There is no staging environment for the order status page. This change goes live immediately on Save. If you want to test without a real purchase, Shopify's test payment mode can be enabled at Admin → Settings → Payments → Enable test mode.

---

## Task 5: UTM Parameters on Meta Ad Links

Add UTM query parameters to all Meta ad landing page URLs so PostHog can attribute traffic to specific campaigns. This is a Meta Ads Manager configuration change — no code required.

**Where:** Meta Ads Manager → Each ad → Edit → Destination URL

- [ ] **Step 1: Add UTM params to current UGC campaign ads**

For the UGC campaign launched 2026-03-26, edit each ad's destination URL to append:

```
?utm_source=instagram&utm_medium=paid_social&utm_campaign=ugc_march_2026
```

Example — if current URL is:
```
https://inanctekstil.store/products/some-product
```

Change to:
```
https://inanctekstil.store/products/some-product?utm_source=instagram&utm_medium=paid_social&utm_campaign=ugc_march_2026
```

For future campaigns, adopt this naming convention:

| Parameter | Value pattern | Example |
|-----------|---------------|---------|
| `utm_source` | Always `instagram` or `facebook` | `instagram` |
| `utm_medium` | Always `paid_social` | `paid_social` |
| `utm_campaign` | `<creative_type>_<month>_<year>` | `ugc_april_2026` |
| `utm_content` | Optional: ad set name or creative variant | `video_01` |

- [ ] **Step 2: Verify UTM params are being captured**

After saving the ads in Meta, wait for clicks to come through (or click the ad yourself from a phone). Then check PostHog:

```sql
SELECT properties.utm_source, properties.utm_medium, properties.utm_campaign, count() as clicks
FROM events
WHERE event = '$pageview'
  AND toDate(timestamp) >= today()
  AND properties.utm_source IS NOT NULL
GROUP BY 1, 2, 3
ORDER BY clicks DESC
```

Expected: rows with `utm_source = 'instagram'`, `utm_medium = 'paid_social'`, etc.

**Note:** PostHog automatically reads UTM params from the URL and stores them as person properties (persisted to the user's profile) and event properties. No code change is needed in the theme.

---

## Verification Summary

After all 5 tasks are complete, run this end-to-end check:

1. **Identity works:** Log in to Shopify, browse a product page, run `posthog.get_distinct_id()` in console → should return your Shopify customer ID (e.g. `"customer_1"`), not a random UUID.

2. **Test filter works:** Open any PostHog insight for today → toggle "Filter test accounts" ON → unique visitors drops by at least 1.

3. **Checkout funnel visible in PostHog:** Create a funnel insight with steps: `add_to_cart` → `checkout_started` → `order_completed`. All three events should appear for test purchases.

4. **UTM attribution visible:** The referrer breakdown on today's pageviews should show `utm_source = instagram` rows (after UTM params are live on ads).
