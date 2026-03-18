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
| `create_ad_creative` (multi-image) | FAIL-FIXED | BUG-3: `asset_feed_spec` path sent `object_story_spec` alongside it — error 1443048. Fix: use `feed["page_ids"]`, drop `object_story_spec`. Committed `bb8e7b1`, needs restart. |
| `create_ad_creative` (text variants) | FAIL-FIXED | Same BUG-3 — same fix, same commit |
| `clone_ad_creative` | FAIL-FIXED | BUG-2: Meta has no `/copies` edge for creatives. Fix: read-then-create flow. Committed, needs restart. |
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
| `create_custom_audience` (WEBSITE) | FAIL-FIXED | BUG-4: `subtype` field rejected in v25 for WEBSITE/ENGAGEMENT/LOOKALIKE/APP. Fix: omit `subtype` for these types, keep only for CUSTOM. Committed, needs restart. |
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

## Bugs Fixed in This Session

| ID | Tool | Description | Commit |
|----|------|-------------|--------|
| BUG-1 | `upload_ad_image_asset` | Local file path: read bytes → base64 encode (was pre-existing) | Pre-existing fix |
| BUG-2 | `clone_ad_creative` | `/copies` edge doesn't exist for creatives; replaced with read-then-create | Committed, needs restart |
| BUG-3 | `create_ad_creative` | `asset_feed_spec` path sent `object_story_spec` simultaneously → error 1443048; fix: `page_ids` inside feed, no `object_story_spec` | `bb8e7b1`, needs restart |
| BUG-4 | `create_custom_audience` | `subtype` rejected by API v25 for WEBSITE/ENGAGEMENT/LOOKALIKE/APP | Committed, needs restart |
| BUG-5 | `search_ads_archive` | Raw 400 passthrough; fix: detect permission error, return structured guidance | Committed, needs restart |

---

## Required User Actions

1. **Accept Custom Audience ToS** — `https://business.facebook.com/ads/manage/customaudiences/tos/?act=1460297365542314`
2. **Apply for Ads Library API access** — `https://www.facebook.com/ads/library/api`

---

## Pending / Next Steps

- Restart MCP session to activate all 4 committed fixes (BUG-2 through BUG-5)
- Verify `create_ad_creative` multi-image and text variants after restart
- Verify `clone_ad_creative` after restart
- Verify `create_custom_audience` WEBSITE after restart
- Test `create_ad_rule` after account accumulates spend history
- Test `create_campaign_budget_schedule` with a proper CBO campaign
- Test LOOKALIKE audience creation (needs source audience)
- Clean up test campaign `6934184002856` and ad set `6934184136656` when no longer needed
- Plan for v26.0 metric deprecations (May 19 2026): `unique_clicks`, `unique_ctr`, `unique_link_clicks_ctr`, `unique_outbound_clicks_ctr`, `cost_per_unique_click`, `cost_per_unique_outbound_click`

---

## Asset IDs Reference

| Asset | ID |
|-------|----|
| Ad account | `act_1460297365542314` |
| Facebook page | `1064624423394553` |
| Pixel | `1446692113800169` |
| Instagram actor | `17841474071069454` |
| Test campaign | `6934184002856` (PAUSED) |
| Test ad set | `6934184136656` (PAUSED) |
| Room image 1 (wine wall) | hash `1c972bb0deb1a5067ab2d0e2d7726bd8` |
| Room image 2 (blue wall) | hash `48e1532ed23858129788189a456250fa` |
| Carousel creative | `1589674722112639` |
