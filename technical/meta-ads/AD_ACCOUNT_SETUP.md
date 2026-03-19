# Meta Ads Account Setup Checklist

**Account:** `act_1460297365542314` — İnanç Tekstil
**Pixel:** `1446692113800169` — inanctekstil.store
**Catalog:** `25593862530291556`
**Daily spend limit (Meta):** ₺2,219.04 (new account cap — lifts automatically as spend history builds)

Use this document to track what needs to be done before activating campaigns.

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| [x] | Done |
| [ ] | To do |
| [!] | Needs investigation |

---

## 1. Billing

- [x] Credit card confirmed
- [x] Account status: Active
- [ ] **Raise Meta's automatic daily spend limit** — currently ₺2,219.04. This lifts automatically as the account builds spend history. No action needed now, but keep in mind when scaling budgets.

---

## 2. Domain Verification

**Why it matters:** Required for Aggregated Event Measurement (AEM) and proper iOS14+ attribution. Without it, Meta cannot reliably attribute purchases from iOS users.

- [x] **TXT record added to DNS** — applied via Terraform (`5d277bd`)
  Record: `facebook-domain-verification=a88frdgxv5jt1kwa7kosgx34hf7wre`

- [x] **Verified in Meta Business Manager** — `inanctekstil.store` confirmed verified

---

## 3. Pixel Events (Shopify → Meta)

**Why it matters:** The pixel is only firing `PageView`. Without purchase/cart events, Meta has no signal to optimize conversion campaigns toward buyers.

**Good news:** You already have Meta Sales Channel installed with "Maximum" data sharing. This means Shopify automatically sends all standard events server-side (CAPI) + browser-side. You do NOT need to manually configure Customer Events.

**What to verify instead:**

- [ ] Go to **Meta Events Manager** → select pixel `1446692113800169` → "Test Events" tab
  - Load `https://inanctekstil.store` → should see `PageView` appear
  - Add a product to cart → should see `AddToCart`
  - Start checkout → should see `InitiateCheckout`
  - Complete a test purchase → should see `Purchase`

- [ ] If events are missing, check **Shopify Admin → Apps → Meta** → confirm "Data sharing" is set to Maximum and the pixel ID shown matches `1446692113800169`

- [ ] In **Meta Events Manager → Overview**, confirm these events appear under "Active":
  - `PageView`
  - `ViewContent`
  - `AddToCart`
  - `InitiateCheckout`
  - `Purchase`

---

## 4. Aggregated Event Measurement (AEM)

**Why it matters:** iOS14+ limits each domain to reporting only 8 conversion events. You must tell Meta which 8 to prioritize, in order of importance.

**Prerequisite:** Domain must be verified (step 2) first.

- [ ] Go to **Meta Events Manager → Aggregated Event Measurement → Configure Web Events**
- [ ] Add `inanctekstil.store` and set event priority (top to bottom = highest priority):
  1. `Purchase`
  2. `InitiateCheckout`
  3. `AddToCart`
  4. `ViewContent`
  5. `PageView`
  *(5 is enough; you have 3 slots remaining for future use)*

---

## 5. Custom Audiences ToS

- [x] General Custom Audiences ToS accepted (WEBSITE audiences confirmed working — `create_custom_audience` tested successfully)
- [x] Custom Audience (CUSTOM — customer list) ToS accepted per your confirmation

**No further action needed here.** If a future CUSTOM audience upload fails with a ToS error, revisit:
`https://business.facebook.com/ads/manage/customaudiences/tos/?act=1460297365542314`

---

## 6. Product Catalog

**Current state:** 4 products, 2 variants visible in Commerce Manager. 2 critical issues in the Events tab.

- [!] **Investigate the 2 critical issues in Commerce Manager → Events tab**
  Common causes:
  - `ViewContent` / `Purchase` events not firing with `content_ids` that match catalog product IDs
  - Shopify product IDs in pixel events don't match the catalog feed format Meta expects
  - Fix: In Meta Sales Channel (Shopify), ensure product catalog is connected to the same pixel

- [ ] **Why only 4 products?** Your PMS has 14 designs but only 4 synced to Shopify:
  `blk-sonil`, `fon-hurrem`, `stn-saten`, `tul-bornova`
  → Sync more products to Shopify first, then catalog will automatically expand
  → See PMS at `pms.inanctekstil.store`

- [ ] **Verify catalog is connected to ad account** in Commerce Manager → Settings → Ad Accounts → confirm `act_1460297365542314` is listed

---

## 7. Campaign Fixes

### Campaign 1: Katalog — Ürün Satışları `6933662901256`

| # | Issue | Status |
|---|-------|--------|
| C1-1 | Ad set `LINK_CLICKS` → `LANDING_PAGE_VIEWS` | ✅ Applied |
| C1-2 | Pixel tracking specs added to Blackout + Saten ads | ✅ Applied |
| C1-3 | `destination_type: UNDEFINED` — needs `WEBSITE` | [ ] Not yet — `destination_type` not exposed in `update_ad_set`; needs ad set rebuild |
| C1-4 | Budget ₺45/day too low for conversion optimization | [ ] Raise to ₺150–200/day before activating |
| C1-5 | Campaign named "Dinamik" but no catalog integration | [ ] Decide: rename OR rebuild as true DPA (requires step 6 catalog fixes first) |
| C1-6 | Only Blackout + Saten ads — no Tül, no Fon | [ ] Add after more products synced to Shopify |
| C1-7 | Switch to `OFFSITE_CONVERSIONS` once pixel fires Purchase | [ ] Do after step 3 (pixel events) confirmed |

### Campaign 2: Reels — Farkındalık (Soğuk Kitle) `6933660244056`

| # | Issue | Status |
|---|-------|--------|
| C2-1 | Static image in Reels — needs video creative | [ ] Upload a 15–30s video (room reveal, product showcase, slideshow) |
| C2-2 | `SHOP_NOW` → `LEARN_MORE` | ✅ New creative `793405240111328` created |
| C2-3 | No frequency cap | ✅ New ad set `6934611186856` created with max 3/7 days |
| C2-4 | Duplicate no-UTM ad deleted | ✅ Ad `6933661259056` deleted |
| C2-5 | Old ad + old ad set paused | ✅ Ad `6933661911256` + ad set `6933660347256` paused |
| C2-6 | New ad `6934611326856` created under freq-capped ad set | ✅ PAUSED, ready to activate |

---

## 8. Upcoming: v26.0 Metric Deprecations (deadline May 19, 2026)

These metrics will stop working in `list_insights` / `create_report` after May 19, 2026:

- `unique_clicks`
- `unique_ctr`
- `unique_link_clicks_ctr`
- `unique_outbound_clicks_ctr`
- `cost_per_unique_click`
- `cost_per_unique_outbound_click`

**Action:** Audit any dashboards or reports using these fields and replace with non-unique equivalents before the deadline. No urgency yet.

---

## Quick Reference: Current Asset IDs

| Asset | ID |
|-------|----|
| Ad account | `act_1460297365542314` |
| Pixel | `1446692113800169` |
| Facebook page | `1064624423394553` |
| Instagram actor | `17841474071069454` |
| Catalog | `25593862530291556` |
| Campaign — Sales | `6933662901256` |
| Campaign — Awareness | `6933660244056` |
| Ad set — Sales | `6933663283856` |
| Ad set — Awareness (old, paused) | `6933660347256` |
| Ad set — Awareness (freq cap, active) | `6934611186856` |
| Ad — Awareness (active) | `6934611326856` |
| Creative — Awareness LEARN_MORE | `793405240111328` |
