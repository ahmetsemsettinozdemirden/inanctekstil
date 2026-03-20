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

- [x] **Domain allowlist configured** — added `inanctekstil.store` and `1z7hb1-2d.myshopify.com` to Traffic Permissions allow list in Events Manager → Settings → Traffic permissions – websites

- [x] **Diagnostics cleared** — "Confirm domains that belong to you" issue resolved (2026-03-19)

---

## 3. Pixel Events (Shopify → Meta)

**Why it matters:** All funnel events must fire for Meta to optimize conversion campaigns.

- [x] All 6 events confirmed active in Events Manager (2026-03-19):
  - `PageView` — 528 events, 6.2/10 match quality
  - `ViewContent` — 136 events, 6.2/10 match quality
  - `AddToCart` — 20 events, 4.7/10 match quality
  - `InitiateCheckout` — 11 events, 4.5/10 match quality
  - `AddPaymentInfo` — 2 events, 7.4/10 match quality (CAPI only)
  - `Purchase` — 1 event, 8.0/10 match quality (CAPI only)

- [x] **Automatic Advanced Matching enabled** (2026-03-19) — all 8 parameters on: email, phone, name, gender, city/region/postcode, country, DOB, external ID. Match quality on browser-side events (AddToCart, InitiateCheckout) expected to improve within 24–48h.

---

## 4. Aggregated Event Measurement (AEM)

**Status:** Meta no longer exposes a manual "Configure Web Events" interface in the current UI. AEM is now handled automatically when domain verification is complete and CAPI + pixel are both active. No action required.

**Evidence:** Domain verified ✅, all events firing ✅, purchase event has 8.0/10 match quality ✅

---

## 5. Custom Audiences ToS

- [x] General Custom Audiences ToS accepted (WEBSITE audiences confirmed working — `create_custom_audience` tested successfully)
- [x] Custom Audience (CUSTOM — customer list) ToS accepted per your confirmation

**No further action needed here.** If a future CUSTOM audience upload fails with a ToS error, revisit:
`https://business.facebook.com/ads/manage/customaudiences/tos/?act=1460297365542314`

---

## 6. Product Catalog

**Current state:** 4 products synced to Shopify/catalog. 6 items total in catalog.

- [x] **Investigated 2 critical issues in Commerce Manager → Events tab** (2026-03-19)
  - Root cause: no AddToCart or Purchase events in the last 7 days — low traffic, not a pixel bug
  - Catalogue match rate: **100%** — when events do fire, `content_ids` correctly match catalog IDs
  - Product purchases show "Missing" because the 1 Purchase event is outside the 28-day window
  - **No fix needed.** Alerts will resolve automatically as traffic increases.

- [x] **Catalog connected to ad account** — `act_1460297365542314` confirmed in Commerce Manager → Settings → Business assets → Ads (2026-03-19)

- [ ] **Only 4 products synced.** PMS has 14 designs but only 4 in Shopify:
  `blk-sonil`, `fon-hurrem`, `stn-saten`, `tul-bornova`
  → Sync more products via PMS at `pms.inanctekstil.store`, catalog will expand automatically

---

## 7. Campaign Fixes

### Campaign 1: Katalog — Ürün Satışları `6933662901256`

| # | Issue | Status |
|---|-------|--------|
| C1-1 | Ad set `LINK_CLICKS` → `LANDING_PAGE_VIEWS` | ✅ Applied |
| C1-2 | Pixel tracking specs added to Blackout + Saten ads | ✅ Applied |
| C1-3 | `destination_type: UNDEFINED` — needs `WEBSITE` | ✅ New ad set `6934642328656` created with `destination_type: WEBSITE`, ₺150/day, `promoted_object: pixel+PURCHASE`; old ad set `6933663283856` paused (2026-03-19) |
| C1-4 | Budget ₺45/day too low for conversion optimization | ✅ Raised to ₺150/day in new ad set `6934642328656` |
| C1-5 | Campaign named "Dinamik" but no catalog integration | [ ] Decide: rename OR rebuild as true DPA (sync more products to Shopify first) |
| C1-6 | Only Blackout + Saten ads — no Tül, no Fon | [ ] Add after more products synced to Shopify |
| C1-7 | Switch to `OFFSITE_CONVERSIONS` once more Purchases fire | [ ] Switch when Purchase volume > 10/week |
| C1-8 | Facebook Story placement — low engagement in TR | ✅ Removed; Sales ad set now: FB Feed + IG stream/story/reels only |
| C1-9 | Creatives missing description, WhatsApp CTA, Saten headline weak | ✅ Rebuilt as v3 (2026-03-19) |
| C1-10 | Blackout WhatsApp CTA "kurulum için" → "sipariş için" | ✅ Rebuilt as v4; ad `6934748708656` PAUSED (2026-03-19) |

### Campaign 2: Reels — Farkındalık (Soğuk Kitle) `6934664141256`

| # | Issue | Status |
|---|-------|--------|
| C2-1 | Video creative for Reels | ✅ Video `4525340454399489`; creative v3 `25906779639024635`; ad v3 `6934742353056` PAUSED |
| C2-2 | Frequency cap | ✅ Ad set `6934664327456` — max 3 per 7 days |
| C2-3 | Instagram Reels only, interior design interests | ✅ |
| C2-4 | Reels link → homepage | ✅ Fixed to `/collections/all` in v3 |
| C2-5 | Awareness serving to past website visitors (wasted spend) | ✅ Excluded custom audience `6934748660856` (website visitors 30d) (2026-03-19) |

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
| Ad set — Sales (old, PAUSED — destination_type UNDEFINED) | `6933663283856` |
| Ad set — Sales v2 (PAUSED — destination_type WEBSITE, ₺150/day) | `6934642328656` |
| Campaign — Awareness | `6934664141256` |
| Ad set — Awareness (freq cap, PAUSED) | `6934664327456` |
| Ad — Blackout Sonil v4 (PAUSED) | `6934748708656` |
| Ad — Saten Perde v3 (PAUSED) | `6934742342856` |
| Ad — Awareness video Reels v3 (PAUSED) | `6934742353056` |
| Creative — Blackout Sonil v4 | `1849171629127247` |
| Creative — Saten Perde v3 | `1288234709868688` |
| Creative — Awareness video Reels v3 | `25906779639024635` |
| Custom Audience — Website Visitors 30d | `6934748660856` |
| Video — İnanç Tekstil MVP | `4525340454399489` |
