# Meta Ads MCP — Manual Test Log

**Account:** `act_1460297365542314`
**Page:** `1064624423394553`
**Pixel:** `1446692113800169`
**Test campaign:** `6934184002856` (PAUSED)
**Test ad set:** `6934184136656` (PAUSED)
**API version:** v25.0
**MCP version:** armavita-meta-ads-mcp (nested repo at `technical/meta-ads/armavita-meta-ads-mcp/`)

---

## Legend

| Status | Meaning |
|--------|---------|
| PASS | Tool works correctly end-to-end |
| PASS* | Works but needs session restart to activate a fix |
| FAIL-FIXED | Was broken, fix committed (needs restart) |
| FAIL-KNOWN | Fails for known non-code reason (account gate, ToS, etc.) |
| FAIL-OPEN | Bug not yet fixed |

---

## Account / Meta-Level Tools

| Tool | Status | Notes |
|------|--------|-------|
| `list_ad_accounts` | PASS | Returns `act_1460297365542314` |
| `read_ad_account` | PASS | Returns account fields, currency TRY |
| `list_account_pages` | PASS | Returns page `1064624423394553` |
| `list_pixels` | PASS | Returns pixel `1446692113800169` |
| `get_instagram_actor_id` | PASS | Returns `17841474071069454` |
| `list_ad_videos` | PASS | Returns paginated video list |
| `read_ad_video` | PASS | Returns video fields |
| `list_insights` | PASS | Returns empty data on zero-spend account |

---

## Campaign Tools

| Tool | Status | Notes |
|------|--------|-------|
| `create_campaign` | PASS | Must use `use_ad_set_level_budgets=true` (no campaign-level budget on new accounts) |
| `list_campaigns` | PASS | |
| `read_campaign` | PASS | |
| `update_campaign` | PASS | |
| `clone_campaign` | PASS | Creates `6934184002856` copy |
| `delete_campaign` | PASS | Tested on clone |
| `create_campaign_budget_schedule` | FAIL-KNOWN | Requires CBO campaign with `daily_budget`; ad-set-level budget campaigns unsupported |

---

## Ad Set Tools

| Tool | Status | Notes |
|------|--------|-------|
| `create_ad_set` | PASS | Must pass `bid_strategy=LOWEST_COST_WITHOUT_CAP` explicitly |
| `list_ad_sets` | PASS | |
| `read_ad_set` | PASS | |
| `update_ad_set` | PASS | |
| `clone_ad_set` | PASS | |
| `delete_ad_set` | PASS | Tested on clone |

---

## Ad Creative Tools

| Tool | Status | Notes |
|------|--------|-------|
| `upload_ad_image_asset` | PASS | Local file path fixed (BUG-1). Uploaded room images successfully |
| `read_ad_image` | PASS | |
| `list_ad_creatives` | PASS | |
| `read_ad_creative` | PASS | |
| `update_ad_creative` | PASS | Returns limitation message: most fields immutable after publish |
| `create_ad_creative` (single image) | PASS | `ad_image_hash` + `object_story_spec` path works |
| `create_ad_creative` (video) | PASS | Auto-fetches thumbnail |
| `create_ad_creative` (carousel) | PASS | Created `1589674722112639` with `carousel_cards` |
| `create_ad_creative` (multi-image) | PASS | BUG-3 verified 2026-03-19 — creative `938699545190851` |
| `create_ad_creative` (text variants) | PASS | BUG-3b verified 2026-03-19 — creative `2772447859756676` with 2 body + 2 headline variants |
| `clone_ad_creative` | PASS | BUG-2 verified 2026-03-19 — also fixed BUG-2b (`act_` prefix) + BUG-2c (asset_feed_spec needs page_id companion); creative `948493427692382` |
| `list_ad_previews` | PASS | Returns preview HTML/URLs for feeds and stories |
| `export_ad_image_file` | PASS | Downloads creative thumbnail to local file |

---

## Ad Tools

| Tool | Status | Notes |
|------|--------|-------|
| `create_ad` | PASS | |
| `list_ads` | PASS | |
| `read_ad` | PASS | |
| `update_ad` | PASS | |
| `clone_ad` | PASS | |
| `delete_ad` | PASS | |

---

## Audience Tools

| Tool | Status | Notes |
|------|--------|-------|
| `list_custom_audiences` | PASS | |
| `read_custom_audience` | PASS | |
| `create_custom_audience` (CUSTOM) | FAIL-KNOWN | Requires ToS acceptance at `business.facebook.com/ads/manage/customaudiences/tos/?act=1460297365542314` |
| `create_custom_audience` (WEBSITE) | PASS | BUG-4 verified 2026-03-19 — audience `6934541085056` (deleted after test) |
| `create_custom_audience` (LOOKALIKE) | UNTESTED | Needs a source audience first |
| `delete_custom_audience` | PASS | |
| `add_users_to_audience` | UNTESTED | Blocked by ToS gate on audience creation |
| `remove_users_from_audience` | UNTESTED | Same |
| `estimate_audience_size` | PASS | Returns lower/upper bound for targeting spec |

---

## Targeting / Search Tools

| Tool | Status | Notes |
|------|--------|-------|
| `search_interests` | PASS | Returns FB interest taxonomy |
| `suggest_interests` | PASS | Returns related interests given seed |
| `search_behaviors` | PASS | Returns behavior targeting options |
| `search_demographics` | PASS | Returns demographic targeting options |
| `search_geo_locations` | PASS | Returns city/country/region matches |
| `search_pages` | PASS | Returns page search results |

---

## Ad Rule Tools

| Tool | Status | Notes |
|------|--------|-------|
| `create_ad_rule` | FAIL-KNOWN | Persistent 500 on zero-spend new account. Likely eligibility gate (account must have spending history). Tried multiple evaluation_spec formats — all 500. |
| `list_ad_rules` | PASS | Returns empty list |
| `read_ad_rule` | UNTESTED | No rules to read |
| `update_ad_rule` | UNTESTED | |
| `delete_ad_rule` | UNTESTED | |
| `execute_ad_rule` | UNTESTED | |

---

## Reporting Tools

| Tool | Status | Notes |
|------|--------|-------|
| `list_insights` | PASS | Returns empty data on zero-spend account |
| `create_report` | PASS | Async report creation returns report run ID |
| `read_web_content` | PASS | Use `<prefix>:<id>` format e.g. `campaign:6933662901256` |
| `search_web_content` | PASS | |

---

## Ads Archive Tool

| Tool | Status | Notes |
|------|--------|-------|
| `search_ads_archive` | FAIL-FIXED | BUG-5: Returned raw 400 without guidance. Fix: detect subcode 2332002 / code 10, return structured actionable guidance. Committed, needs restart. Requires Ads Library API approval at `facebook.com/ads/library/api`. |

---

## Bugs Fixed

| ID | Tool | Description | Status |
|----|------|-------------|--------|
| BUG-1 | `upload_ad_image_asset` | Local file path: read bytes → base64 encode (was pre-existing) | VERIFIED |
| BUG-2 | `clone_ad_creative` | Meta has no `/copies` edge; replaced with read-then-create flow | VERIFIED 2026-03-19 |
| BUG-2b | `clone_ad_creative` | `account_id` returned without `act_` prefix; fixed in `_build_creative_clone_payload` | VERIFIED 2026-03-19 |
| BUG-2c | `clone_ad_creative` | `asset_feed_spec` clones require `object_story_spec: {page_id}` companion; missing in original fix | VERIFIED 2026-03-19 |
| BUG-3 | `create_ad_creative` | `asset_feed_spec` path erroneously sent full `object_story_spec` → error 1443048 | VERIFIED 2026-03-19 |
| BUG-3b | `create_ad_creative` | Text variants without image produced `images:[]` in feed → silent API error | VERIFIED 2026-03-19 |
| BUG-4 | `create_custom_audience` | `subtype` rejected by API v25 for WEBSITE/ENGAGEMENT/LOOKALIKE/APP | VERIFIED 2026-03-19 |
| BUG-5 | `search_ads_archive` | Raw 400 passthrough; detect subcode 2332002, return structured guidance | VERIFIED |
| BUG-6 | `create_ad_rule` | Persistent 500 on new accounts surfaced as raw error; now returns eligibility guidance | VERIFIED |
| BUG-7 | `create_campaign_budget_schedule` | CBO requirement error surfaced as raw error; now returns actionable guidance | VERIFIED |

---

## Required User Actions

1. **Accept Custom Audience ToS** — `https://business.facebook.com/ads/manage/customaudiences/tos/?act=1460297365542314`
2. **Apply for Ads Library API access** — `https://www.facebook.com/ads/library/api`

---

## Pending / Next Steps

### Account-gated (not code bugs — need real account activity)
- `create_ad_rule` — test after account accumulates spend history (currently 500 with eligibility guidance)
- `create_campaign_budget_schedule` — test with a proper CBO campaign (requires campaign-level `daily_budget`)
- `create_custom_audience` (LOOKALIKE) — needs an existing source audience first
- `create_custom_audience` (CUSTOM) — blocked by ToS; accept at required URL below

### v26.0 metric deprecations (deadline: May 19, 2026)
Metrics that will break `list_insights` / `create_report` if used:
`unique_clicks`, `unique_ctr`, `unique_link_clicks_ctr`, `unique_outbound_clicks_ctr`, `cost_per_unique_click`, `cost_per_unique_outbound_click`

### Optional enhancements
- ENH-4: Auto-inject pixel tracking specs on SALES/TRAFFIC `create_ad` (currently caller must pass `tracking_specs` manually)
- ENH-7: Bulk pause/activate all ads in a campaign
- ENH-8: True DPA catalog creative support (`product_catalog_id` in `create_ad_creative`)

---

## Asset IDs Reference

| Asset | ID |
|-------|----|
| Ad account | `act_1460297365542314` |
| Facebook page | `1064624423394553` |
| Pixel | `1446692113800169` |
| Instagram actor | `17841474071069454` |
| Room image 1 (wine wall) | hash `1c972bb0deb1a5067ab2d0e2d7726bd8` |
| Room image 2 (blue wall) | hash `48e1532ed23858129788189a456250fa` |
| Carousel creative | `1589674722112639` |
