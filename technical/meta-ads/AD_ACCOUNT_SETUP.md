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

- [ ] **Add TXT record to DNS** — already added to Terraform, needs `apply`:
  ```
  cd technical/gitopsprod
  terraform plan   # verify only the TXT record is being added
  terraform apply
  ```
  Record value: `facebook-domain-verification=a88frdgxv5jt1kwa7kosgx34hf7wre`

- [ ] **Verify in Meta Business Manager:**
  1. Go to Business Manager → Brand Safety → Domains
  2. Find `inanctekstil.store`
  3. Click "Verify" — DNS propagation may take up to 24h after Terraform apply

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

## 7. Campaign Fixes (do after steps 1–6)

These are all doable via the MCP — tell Claude to "apply campaign fixes" when ready.

### Campaign 1: Katalog — Ürün Satışları (Dinamik) `6933662901256`

| # | Issue | Fix |
|---|-------|-----|
| C1-1 | Ad set optimizes for `LINK_CLICKS` on an OUTCOME_SALES campaign | Change to `LANDING_PAGE_VIEWS` now; switch to `OFFSITE_CONVERSIONS` once pixel fires Purchase events |
| C1-2 | Ads have no pixel tracking specs | Add `{"action.type": ["offsite_conversion"], "fb_pixel": ["1446692113800169"]}` to both ads |
| C1-3 | `destination_type: UNDEFINED` on ad set | Update to `WEBSITE` |
| C1-4 | Budget ₺45/day is too low for conversion optimization | Raise to ₺150–200/day minimum; at ₺45/day Meta can't exit the learning phase (needs ~50 conversions/week) |
| C1-5 | Campaign named "Dinamik" but no catalog integration | Either: (a) rename to reflect what it actually is, or (b) rebuild as a true Dynamic Product Ad using catalog `25593862530291556` — requires catalog issues (step 6) fixed first |
| C1-6 | Only 2 product categories (Blackout + Saten) — no Tül, no Fon | Add ads for remaining collections once more products are synced |

### Campaign 2: Reels — Farkındalık (Soğuk Kitle) `6933660244056`

| # | Issue | Fix |
|---|-------|-----|
| C2-1 | Static image ad on Instagram Reels placement | Replace creative with a video (15–30s room reveal, product showcase, or slideshow video) — Reels is video-first, static images perform poorly |
| C2-2 | `SHOP_NOW` CTA on an awareness campaign | Change to `LEARN_MORE` — awareness audiences aren't in buying mode |
| C2-3 | No frequency cap — same people see ad repeatedly | Add `frequency_control_specs`: max 3 impressions per 7 days |
| C2-4 | Duplicate paused ad `6933661259056` (no UTM version) | Delete it — superseded by the UTM version |

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
| Ad set — Awareness | `6933660347256` |
