# armavita-meta-ads-mcp: Deep Investigation Report

**Date:** 2026-03-18
**Scope:** Full source audit of `/src/armavita_meta_ads_mcp/core/`
**Purpose:** Identify bugs, limitations, and enhancement opportunities for Inanc Tekstil Meta Ads workflow.

---

## 1. Architecture Overview

```
armavita_meta_ads_mcp/
  core/
    graph_constants.py      -- API version, base URLs
    graph_client.py         -- HTTP layer, key aliasing, auth decorator
    auth_state.py           -- Token storage, OAuth flow
    mcp_runtime.py          -- FastMCP server instance
    media_helpers.py        -- Image download utilities, logger
    ad_tools.py             -- Ads, creatives, image upload, page discovery (~1500 lines)
    adset_tools.py          -- Ad set CRUD
    campaign_tools.py       -- Campaign CRUD
    duplication_tools.py    -- Clone campaign/adset/ad/creative
    insight_tools.py        -- Performance metrics/reporting
    targeting_tools.py      -- Interest/geo/audience search
    account_tools.py        -- Account info
    report_tools.py         -- Report creation
    budget_schedule_tools.py
    ads_archive_tools.py
    research_tools.py
```

**Transport:** stdio, FastMCP
**API version:** Graph v25.0 (configurable via `META_GRAPH_API_VERSION` env)
**Auth:** `META_ACCESS_TOKEN` env var or OAuth flow

---

## 2. Confirmed Bugs

### BUG-1: `upload_ad_image_asset` — local file path not read from disk

**File:** `ad_tools.py:763-780`
**Severity:** Critical (tool silently broken)

When `image_file_path` is a filesystem path (not a `data:` URL), the code does:
```python
encoded_image = image_file_path.strip()  # sends the path string as base64!
```
The path string (~75 chars) gets sent to Meta API as the `bytes` field instead of actual image data. Meta rejects it silently or returns a corrupt image hash.

**Root cause:** Missing `open(image_file_path, "rb")` + `base64.b64encode()` branch.

**Workaround (current):** Use `image_source_url` with a public CDN URL instead.

**Fix required:**
```python
else:
    # It's a filesystem path
    with open(image_file_path, "rb") as f:
        encoded_image = base64.b64encode(f.read()).decode("utf-8")
    if not inferred_name:
        inferred_name = os.path.basename(image_file_path)
```

---

### BUG-2: `create_ad_creative` — `instagram_actor_id` format mismatch

**File:** `ad_tools.py:1020, 1078-1133`
**Severity:** High

The tool accepts `instagram_actor_id` (passed to `object_story_spec.instagram_actor_id`). However, the ID visible in Meta Business Manager (`1074486572406385`) is the Instagram Business Account **asset ID**, NOT the page-scoped actor ID that the Graph API expects.

The correct actor ID is the numeric ID returned by `/{facebook_page_id}?fields=instagram_accounts` or `/{instagram_account_id}` when queried with page-level access.

**Error received:** `(#100) Param instagram_actor_id must be a valid Instagram account id`

**Fix required:** Add an `instagram_actor_id` auto-resolution helper that queries `/{facebook_page_id}?fields=instagram_accounts{id}` and surfaces the correct ID.

---

### BUG-3: `create_ad_creative` — no carousel (multi-card) support

**File:** `ad_tools.py:1000-1161`
**Severity:** High (missing feature treated as bug because tool accepts `carousel_cards` silently)

`create_ad_creative` supports:
- Single image (`ad_image_hash`)
- Multi-image flex/asset feed (`ad_image_hashes` — same destination URL for all)
- Single video (`ad_video_id`)

It does NOT support carousel ads where each card has its own image, headline, and URL. There is no `carousel_cards` parameter. Passing it as a keyword argument does nothing — it's silently ignored.

**Fix required:** Add a `carousel_cards: Optional[List[Dict]]` parameter and build `object_story_spec.link_data.child_attachments[]`.

---

### BUG-4: `update_ad_set` — `promoted_object` not updatable

**File:** `adset_tools.py:342-402`
**Severity:** Medium

`update_ad_set` does not include `promoted_object` in its signature. Once an ad set is created without it, there is no way to add it via this MCP server.

**Impact:** Cannot fix a SALES campaign ad set that was created without `promoted_object`. Must delete and recreate.

**Fix required:** Add `promoted_object: Optional[Dict[str, Any]] = None` to `update_ad_set` with proper serialization.

---

### BUG-5: `create_ad_set` — `frequency_control_specs` not settable at creation time

**File:** `adset_tools.py:213-337`
**Severity:** Low

`create_ad_set` has no `frequency_control_specs` parameter. It can only be set via `update_ad_set`. This is a cosmetic inconsistency — workaround is to create then immediately update.

---

## 3. Intentional Limitations (by design, not bugs)

### LIMIT-1: `update_ad_creative` blocks all content edits

**File:** `ad_tools.py:1190-1218`

The tool explicitly rejects any attempt to update `primary_text`, `headline_text`, `description_text`, `call_to_action_type`, image hash, video ID, or URL. This is correct — Meta API disallows content updates on existing creatives. The workaround is: create new creative → call `update_ad` with new `ad_creative_id`.

### LIMIT-2: No budget/targeting override on clone

**File:** `duplication_tools.py:207-244`

When cloning campaigns/ad sets, options like `new_daily_budget` and `new_targeting` are accepted as parameters but logged as **warnings** and not applied. Must call `update_campaign` or `update_ad_set` after cloning.

### LIMIT-3: Deep copy hierarchy always included for campaigns

Cloning a campaign always uses `deep_copy: True` — you cannot clone a campaign shell without its ad sets/ads. Selective exclusion is flagged in warnings but not enforced by the Graph API copy edge.

---

## 4. HTTP Layer Details (`graph_client.py`)

### Key remapping
The client automatically renames MCP-friendly parameter names to Graph API names:

| MCP parameter | Graph API field |
|---|---|
| `meta_access_token` | `access_token` |
| `page_size` | `limit` |
| `page_cursor` | `after` |
| `ad_set_id` | `adset_id` |
| `ad_creative_id` | `creative_id` |
| `facebook_page_id` | `page_id` |
| `ad_image_hash` | `image_hash` |
| `ad_image_hashes` | `image_hashes` |
| `ad_video_id` | `video_id` |
| `primary_text` | `message` |
| `description_text` | `description` |
| `image_source_url` | `image_url` |

### POST uses form data
All `POST` requests use `data=request_params` (URL-encoded form body), which is correct for Meta Graph API. NOT JSON body.

### Auto dict/list serialization
`_normalize_request_params` calls `json.dumps()` on any dict or list value. This means callers must NOT pre-serialize values — or else double-serialization occurs. Ad set and campaign tools already pre-serialize `targeting`, `promoted_object`, etc. before passing to `make_api_request`. This works because those values are passed as top-level string fields (not nested dicts).

### Token invalidation on auth errors
On HTTP 190 (invalid token), 102 (session expired), or 10 (permission denied), the auth manager auto-invalidates the stored token.

---

## 5. Missing Features (Enhancement Opportunities)

### ENH-1: Video upload tool
No tool exists to upload a video asset to `/{ad_account_id}/advideos`. Currently you must upload videos manually via Ads Manager or use an already-hosted video ID.

### ENH-2: Instagram actor ID auto-resolution
Add a helper that given a `facebook_page_id`, queries `/{page_id}?fields=instagram_accounts{id,username}` to return the correct actor ID for use in creatives.

**Proposed tool:** `get_instagram_actor_id(facebook_page_id)` → returns the numeric ID to pass to `create_ad_creative`.

### ENH-3: Carousel creative support
Add `carousel_cards: List[Dict]` to `create_ad_creative` with the following card schema:
```json
{
  "image_hash": "abc123",
  "link": "https://...",
  "name": "Card headline",
  "description": "Card body",
  "call_to_action": {"type": "SHOP_NOW"}
}
```
Build as `object_story_spec.link_data.child_attachments`.

### ENH-4: Pixel/tracking auto-injection
When creating ads under an OUTCOME_SALES or OUTCOME_TRAFFIC campaign, automatically inject `tracking_specs` with the account's Pixel ID. Currently the caller must construct this manually:
```json
[{"action.type": ["offsite_conversion"], "fb_pixel": ["PIXEL_ID"]}]
```

**Proposed:** `create_ad` detects campaign objective and auto-populates `tracking_specs` from the account's pixel.

### ENH-5: `promoted_object` on ad set update
Add `promoted_object` to `update_ad_set` signature (see BUG-4).

### ENH-6: Custom audience management
No tools for:
- Listing custom audiences
- Creating custom audiences (customer list / website visitors)
- Creating lookalike audiences

These are critical for retargeting campaigns.

**Proposed tools:** `list_custom_audiences`, `create_custom_audience`, `create_lookalike_audience`

### ENH-7: Bulk status toggle
No tool to pause/activate all ads in a campaign or ad set at once. Currently requires listing all ads and calling `update_ad` individually.

**Proposed:** `bulk_update_ads_status(campaign_id, status)` — calls `/{campaign_id}/ads` with batch update.

### ENH-8: Catalog / Dynamic Product Ads
`create_ad_set` does accept `promoted_object` (including `product_catalog_id`). However:
- No validation or guidance for the OUTCOME_SALES + catalog flow
- `create_ad_creative` has no `product_catalog_id` or `product_set_id` parameters
- True DPA (dynamic creative pulling from catalog) requires a different creative format that is not supported

**Workaround:** Use single-image ads per product category (current approach).

---

## 6. `create_ad_creative` Logic Map

```
create_ad_creative(ad_account_id, ad_image_hash | ad_image_hashes | ad_video_id, ...)
  │
  ├── Validate: exactly one of image_hash / image_hashes / video_id
  ├── Validate: link_url required (unless lead_form_id)
  ├── Auto-fetch video thumbnail if video + no thumbnail
  ├── Resolve facebook_page_id (if not provided, auto-discovers via me/accounts)
  │
  ├── use_asset_feed = has variants or multiple images or optimization_type
  │     TRUE  → build asset_feed_spec + minimal object_story_spec
  │     FALSE → build simple object_story_spec (image or video)
  │
  ├── Add instagram_actor_id to object_story_spec (if provided)
  │     ⚠ Only adds, does not validate the ID format
  │
  └── POST to /{ad_account_id}/adcreatives
        → On success: fetches creative details and returns
        → On instagram error: returns friendly message
```

---

## 7. `upload_ad_image_asset` Logic Map

```
upload_ad_image_asset(ad_account_id, image_file_path | image_source_url, name)
  │
  ├── if image_file_path:
  │     if starts with "data:":
  │       → parse base64 data URL correctly ✓
  │     else:
  │       → BUG: sets encoded_image = path_string (NOT file bytes) ✗
  │
  └── if image_source_url:
        → try_multiple_download_methods (3 user-agent profiles)
        → base64 encode downloaded bytes ✓
        → POST bytes + name to /{ad_account_id}/adimages ✓
```

---

## 8. Ad Set Targeting Structure

The `_normalize_targeting` function in `adset_tools.py` automatically adds `targeting_automation: {advantage_audience: 0}` if not present. To opt into Advantage+ Audience, pass:
```json
{"targeting_automation": {"advantage_audience": 1}}
```

Default targeting (when nothing is passed):
```json
{
  "age_min": 18,
  "age_max": 65,
  "geo_locations": {"countries": ["US"]},
  "targeting_automation": {"advantage_audience": 1}
}
```
Note: default is US. Always pass explicit targeting for Turkish campaigns.

---

## 9. Recommended Fixes Priority

| Priority | Item | Effort |
|---|---|---|
| P0 | BUG-1: Fix local file upload in `upload_ad_image_asset` | Small (5 lines) |
| P1 | ENH-2: Instagram actor ID resolution helper | Small |
| P1 | BUG-3: Carousel creative support | Medium |
| P1 | BUG-4: `promoted_object` on `update_ad_set` | Tiny (3 lines) |
| P2 | ENH-4: Pixel auto-injection on `create_ad` | Medium |
| P2 | ENH-6: Custom audience tools | Large |
| P3 | ENH-5: Bulk status toggle | Small |
| P3 | ENH-1: Video upload | Small |

---

## 10. Inanc Tekstil Specific Notes

### Current asset IDs (hardcode these in enhancements)
| Asset | ID |
|---|---|
| Ad Account | `act_1460297365542314` |
| Facebook Page | `1064624423394553` |
| Meta Pixel | `1754778638989489` |
| Shopify Product Catalog | `25593862530291556` |

### Tracking specs template (always inject for conversion campaigns)
```json
[
  {"action.type": ["offsite_conversion"], "fb_pixel": ["1754778638989489"]},
  {"action.type": ["page_engagement"], "page": ["1064624423394553"]}
]
```

### Instagram actor ID (unresolved)
The Instagram Business Account ID `1074486572406385` does NOT work as `instagram_actor_id`. To resolve: query `GET /1064624423394553?fields=instagram_accounts{id,username}` with a Page access token to get the correct actor ID.

### Catalog campaign limitation
Real Dynamic Product Ads (DPA) pulling from `product_catalog_id: 25593862530291556` are not supported by this MCP server's `create_ad_creative`. Must use Ads Manager UI for true DPA setup.

**Current workaround:** Per-category single-image ads with hardcoded Shopify collection URLs. Works fine for <10 products.
