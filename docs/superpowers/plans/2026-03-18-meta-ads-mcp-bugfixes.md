# Meta Ads MCP Bugfixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 5 confirmed bugs in armavita-meta-ads-mcp and add one logging deprecation fix, with tests for each change.

**Architecture:** All changes are in `technical/meta-ads/armavita-meta-ads-mcp/`. Each fix is isolated to one or two source files plus the corresponding test file. The snapshot test `tests/test_tool_surface.py` must be updated for every tool signature change — it parses source AST directly, so no mocks needed there.

**Tech Stack:** Python 3.11+, pytest + pytest-asyncio, `unittest.mock.AsyncMock`, uv

**Run tests with:** `cd technical/meta-ads/armavita-meta-ads-mcp && uv run pytest --tb=short`

---

## File Map

| File | Changes |
|---|---|
| `src/.../core/adset_tools.py` | BUG-5: add `frequency_control_specs` to `create_ad_set`; BUG-4: add `promoted_object` to `update_ad_set` |
| `src/.../core/ad_tools.py` | BUG-1: fix local file read; BUG-2: add `get_instagram_actor_id` tool; BUG-3: add `carousel_cards` to `create_ad_creative` |
| `src/.../core/report_tools.py` | Fix `datetime.utcnow()` deprecation warning |
| `tests/test_adset_payload_encoding.py` | Add tests for BUG-4 and BUG-5 |
| `tests/test_image_upload.py` | New file — tests for BUG-1 |
| `tests/test_instagram_actor_id.py` | New file — tests for BUG-2 |
| `tests/test_creative_payloads.py` | Add carousel test for BUG-3 |
| `tests/test_tool_surface.py` | Update signature snapshot for every changed/added tool |

**Working directory for all commands:** `technical/meta-ads/armavita-meta-ads-mcp/`

---

## Task 1: BUG-5 — Add `frequency_control_specs` to `create_ad_set`

**Files:**
- Modify: `src/armavita_meta_ads_mcp/core/adset_tools.py:215-337`
- Modify: `tests/test_adset_payload_encoding.py`
- Modify: `tests/test_tool_surface.py`

- [ ] **Step 1: Write the failing test**

Add to `tests/test_adset_payload_encoding.py`:

```python
@pytest.mark.asyncio
async def test_create_adset_serializes_frequency_control_specs():
    with patch("armavita_meta_ads_mcp.core.adset_tools.make_api_request", new_callable=AsyncMock) as mock_api:
        with patch("armavita_meta_ads_mcp.core.adset_tools._parent_campaign_bid_strategy", new_callable=AsyncMock, return_value=None):
            mock_api.return_value = {"id": "adset_1"}
            await create_ad_set(
                ad_account_id="act_123",
                campaign_id="camp_1",
                name="Test",
                optimization_goal="REACH",
                billing_event="IMPRESSIONS",
                frequency_control_specs=[{"event": "IMPRESSIONS", "interval_days": 7, "max_frequency": 2}],
                meta_access_token="token",
            )
    params = mock_api.call_args.args[2]
    assert "frequency_control_specs" in params
    specs = json.loads(params["frequency_control_specs"])
    assert specs[0]["event"] == "IMPRESSIONS"
    assert specs[0]["max_frequency"] == 2
```

Also add `from armavita_meta_ads_mcp.core.adset_tools import create_ad_set` to the imports at the top of the file (check if already present).

- [ ] **Step 2: Run test to confirm failure**

```bash
uv run pytest tests/test_adset_payload_encoding.py::test_create_adset_serializes_frequency_control_specs -v
```

Expected: `FAILED` — `create_ad_set() got an unexpected keyword argument 'frequency_control_specs'`

- [ ] **Step 3: Implement — add `frequency_control_specs` to `create_ad_set`**

In `adset_tools.py`, add parameter to `create_ad_set` signature after `is_dynamic_creative`:

```python
    frequency_control_specs: Optional[List[Dict[str, Any]]] = None,
    meta_access_token: Optional[str] = None,
```

Add serialization in the payload block (after the `is_dynamic_creative` block, before the `make_api_request` call):

```python
    if frequency_control_specs is not None:
        payload["frequency_control_specs"] = json.dumps(frequency_control_specs)
```

- [ ] **Step 4: Update snapshot in `test_tool_surface.py`**

In `test_v1_signature_snapshot`, find the `"create_ad_set"` entry and add `"frequency_control_specs"` before `"meta_access_token"`:

```python
"create_ad_set": [
    "ad_account_id",
    "campaign_id",
    "name",
    "optimization_goal",
    "billing_event",
    "status",
    "daily_budget",
    "lifetime_budget",
    "targeting",
    "bid_amount",
    "bid_strategy",
    "bid_constraints",
    "start_time",
    "end_time",
    "dsa_beneficiary",
    "promoted_object",        # already present — do NOT remove
    "destination_type",       # already present — do NOT remove
    "is_dynamic_creative",
    "frequency_control_specs",   # <-- added
    "meta_access_token",
],
```

- [ ] **Step 5: Run all tests**

```bash
uv run pytest --tb=short
```

Expected: all 44 pass (43 existing + 1 new)

- [ ] **Step 6: Commit**

```bash
git add src/armavita_meta_ads_mcp/core/adset_tools.py tests/test_adset_payload_encoding.py tests/test_tool_surface.py
git commit -m "fix: add frequency_control_specs to create_ad_set"
```

---

## Task 2: BUG-4 — Add `promoted_object` to `update_ad_set`

**Files:**
- Modify: `src/armavita_meta_ads_mcp/core/adset_tools.py:342-402`
- Modify: `tests/test_adset_payload_encoding.py`
- Modify: `tests/test_tool_surface.py`

- [ ] **Step 1: Write the failing test**

Add to `tests/test_adset_payload_encoding.py`:

```python
@pytest.mark.asyncio
async def test_update_adset_serializes_promoted_object():
    with patch("armavita_meta_ads_mcp.core.adset_tools.make_api_request", new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"success": True}
        await update_ad_set(
            ad_set_id="adset_1",
            promoted_object={"product_catalog_id": "25593862530291556"},
            meta_access_token="token",
        )
    params = mock_api.call_args.args[2]
    assert "promoted_object" in params
    obj = json.loads(params["promoted_object"])
    assert obj["product_catalog_id"] == "25593862530291556"
```

Add `from armavita_meta_ads_mcp.core.adset_tools import update_ad_set` to imports if not present.

- [ ] **Step 2: Run test to confirm failure**

```bash
uv run pytest tests/test_adset_payload_encoding.py::test_update_adset_serializes_promoted_object -v
```

Expected: `FAILED` — `update_ad_set() got an unexpected keyword argument 'promoted_object'`

- [ ] **Step 3: Implement — add `promoted_object` to `update_ad_set`**

In `adset_tools.py`, add to `update_ad_set` signature (after `is_dynamic_creative`):

```python
    promoted_object: Optional[Dict[str, Any]] = None,
    meta_access_token: Optional[str] = None,
```

Add serialization in the payload block (after the `is_dynamic_creative` block):

```python
    if promoted_object is not None:
        payload["promoted_object"] = json.dumps(promoted_object)
```

- [ ] **Step 4: Update snapshot in `test_tool_surface.py`**

Find the `"update_ad_set"` entry and add `"promoted_object"` before `"meta_access_token"`:

```python
"update_ad_set": [
    "ad_set_id",
    "frequency_control_specs",
    "bid_strategy",
    "bid_amount",
    "bid_constraints",
    "status",
    "targeting",
    "optimization_goal",
    "daily_budget",
    "lifetime_budget",
    "is_dynamic_creative",
    "promoted_object",    # <-- added
    "meta_access_token",
],
```

- [ ] **Step 5: Run all tests**

```bash
uv run pytest --tb=short
```

Expected: all 45 pass

- [ ] **Step 6: Commit**

```bash
git add src/armavita_meta_ads_mcp/core/adset_tools.py tests/test_adset_payload_encoding.py tests/test_tool_surface.py
git commit -m "fix: add promoted_object to update_ad_set"
```

---

## Task 3: BUG-1 — Fix local file reading in `upload_ad_image_asset`

**Files:**
- Modify: `src/armavita_meta_ads_mcp/core/ad_tools.py:763-780`
- Create: `tests/test_image_upload.py`

- [ ] **Step 1: Write failing tests in new file `tests/test_image_upload.py`**

```python
# Copyright (C) 2025 ArmaVita LLC
# SPDX-License-Identifier: AGPL-3.0-only

import base64
import json
import sys
import tempfile
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from armavita_meta_ads_mcp.core.ad_tools import upload_ad_image_asset


@pytest.mark.asyncio
async def test_upload_reads_local_file_bytes_not_path_string():
    """Regression test for BUG-1: local path must be read from disk, not sent as-is."""
    image_bytes = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100  # fake PNG header

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
        f.write(image_bytes)
        tmp_path = f.name

    with patch("armavita_meta_ads_mcp.core.ad_tools.make_api_request", new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"images": {"abc123": {"hash": "abc123", "url": "https://example.com/img.png"}}}

        result = await upload_ad_image_asset(
            ad_account_id="act_123",
            image_file_path=tmp_path,
            meta_access_token="token",
        )

    payload = json.loads(result)
    assert payload.get("success") is True

    sent_bytes_b64 = mock_api.call_args.args[2]["bytes"]
    decoded = base64.b64decode(sent_bytes_b64)
    assert decoded == image_bytes, "Must send actual file bytes, not the path string"


@pytest.mark.asyncio
async def test_upload_infers_filename_from_local_path():
    image_bytes = b"\xff\xd8\xff"  # fake JPEG header

    with tempfile.NamedTemporaryFile(suffix=".jpg", prefix="my_photo_", delete=False) as f:
        f.write(image_bytes)
        tmp_path = f.name

    with patch("armavita_meta_ads_mcp.core.ad_tools.make_api_request", new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"images": {"h1": {"hash": "h1"}}}

        await upload_ad_image_asset(
            ad_account_id="act_123",
            image_file_path=tmp_path,
            meta_access_token="token",
        )

    sent_name = mock_api.call_args.args[2]["name"]
    assert sent_name.endswith(".jpg")
    assert "my_photo_" in sent_name


@pytest.mark.asyncio
async def test_upload_returns_error_for_missing_file():
    with patch("armavita_meta_ads_mcp.core.ad_tools.make_api_request", new_callable=AsyncMock):
        result = await upload_ad_image_asset(
            ad_account_id="act_123",
            image_file_path="/nonexistent/path/image.png",
            meta_access_token="token",
        )

    payload = json.loads(result)
    assert "error" in payload
    assert "image_file_path" in payload
```

- [ ] **Step 2: Run tests to confirm all three fail**

```bash
uv run pytest tests/test_image_upload.py -v
```

Expected: 3 FAILs. The first two will fail because the path string is sent instead of bytes; the third will fail because no error is returned.

- [ ] **Step 3: Implement the fix in `ad_tools.py`**

Find lines 777-780 (the `else` branch inside `if image_file_path:`):

Current:
```python
        else:
            encoded_image = image_file_path.strip()
            if not inferred_name:
                inferred_name = "upload.png"
```

Replace with:
```python
        else:
            try:
                with open(image_file_path, "rb") as _f:
                    encoded_image = base64.b64encode(_f.read()).decode("utf-8")
            except OSError as exc:
                return _json({"error": f"Cannot read image file: {exc}", "image_file_path": image_file_path})
            if not inferred_name:
                inferred_name = os.path.basename(image_file_path)
```

- [ ] **Step 4: Run tests to confirm all three pass**

```bash
uv run pytest tests/test_image_upload.py -v
```

Expected: 3 PASS

- [ ] **Step 5: Run full suite**

```bash
uv run pytest --tb=short
```

Expected: all 48 pass

- [ ] **Step 6: Commit**

```bash
git add src/armavita_meta_ads_mcp/core/ad_tools.py tests/test_image_upload.py
git commit -m "fix: read local file bytes in upload_ad_image_asset instead of sending path string"
```

---

## Task 4: BUG-2/ENH-2 — Add `get_instagram_actor_id` tool

**Files:**
- Modify: `src/armavita_meta_ads_mcp/core/ad_tools.py` (add helper + tool after `list_account_pages`)
- Create: `tests/test_instagram_actor_id.py`
- Modify: `tests/test_tool_surface.py`

- [ ] **Step 1: Write failing tests in new file `tests/test_instagram_actor_id.py`**

```python
# Copyright (C) 2025 ArmaVita LLC
# SPDX-License-Identifier: AGPL-3.0-only

import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from armavita_meta_ads_mcp.core.ad_tools import get_instagram_actor_id


@pytest.mark.asyncio
async def test_get_instagram_actor_id_returns_first_linked_account():
    with patch("armavita_meta_ads_mcp.core.ad_tools.make_api_request", new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {
            "id": "1064624423394553",
            "instagram_accounts": {
                "data": [
                    {"id": "17841400000000001", "username": "inanc_tekstil"}
                ]
            },
        }

        result = await get_instagram_actor_id(
            facebook_page_id="1064624423394553",
            meta_access_token="token",
        )

    payload = json.loads(result)
    assert payload["instagram_actor_id"] == "17841400000000001"
    assert payload["username"] == "inanc_tekstil"
    assert payload["facebook_page_id"] == "1064624423394553"

    call_args = mock_api.call_args
    assert call_args.args[0] == "1064624423394553"
    assert "instagram_accounts" in call_args.args[2]["fields"]


@pytest.mark.asyncio
async def test_get_instagram_actor_id_returns_error_when_no_linked_account():
    with patch("armavita_meta_ads_mcp.core.ad_tools.make_api_request", new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {
            "id": "1064624423394553",
            "instagram_accounts": {"data": []},
        }

        result = await get_instagram_actor_id(
            facebook_page_id="1064624423394553",
            meta_access_token="token",
        )

    payload = json.loads(result)
    assert "error" in payload
    assert "no instagram account" in payload["error"].lower()


@pytest.mark.asyncio
async def test_get_instagram_actor_id_requires_page_id():
    result = await get_instagram_actor_id(
        facebook_page_id="",
        meta_access_token="token",
    )
    payload = json.loads(result)
    assert "error" in payload
```

- [ ] **Step 2: Run tests to confirm all three fail**

```bash
uv run pytest tests/test_instagram_actor_id.py -v
```

Expected: `ImportError` — `get_instagram_actor_id` does not exist yet.

- [ ] **Step 3: Implement the new tool in `ad_tools.py`**

Add after `list_account_pages` (end of file, around line 1556):

```python


async def _resolve_instagram_actor_id(
    facebook_page_id: str,
    meta_access_token: str,
) -> Optional[Dict[str, Any]]:
    """Query a Facebook page for its linked Instagram account actor ID."""
    payload = await make_api_request(
        facebook_page_id,
        meta_access_token,
        {"fields": "instagram_accounts{id,username}"},
    )
    if not isinstance(payload, dict):
        return None
    accounts = payload.get("instagram_accounts")
    if not isinstance(accounts, dict):
        return None
    data = accounts.get("data", [])
    if not data or not isinstance(data[0], dict):
        return None
    return {"id": str(data[0]["id"]), "username": data[0].get("username", "")}


@mcp_server.tool()
@meta_api_tool
async def get_instagram_actor_id(
    facebook_page_id: str,
    meta_access_token: Optional[str] = None,
) -> str:
    """Resolve the Instagram actor ID linked to a Facebook page.

    The actor ID returned here is what should be passed as instagram_actor_id
    in create_ad_creative. It differs from the Instagram Business Account asset
    ID visible in Meta Business Manager.
    """
    if not facebook_page_id:
        return _json({"error": "No facebook_page_id provided"})

    account = await _resolve_instagram_actor_id(facebook_page_id, meta_access_token)
    if not account:
        return _json({
            "error": "No instagram account linked to this Facebook page",
            "facebook_page_id": facebook_page_id,
            "suggestion": "Connect an Instagram account to the page in Meta Business Settings.",
        })

    return _json({
        "instagram_actor_id": account["id"],
        "username": account["username"],
        "facebook_page_id": facebook_page_id,
        "usage": "Pass instagram_actor_id to create_ad_creative to show ads from this Instagram account.",
    })
```

- [ ] **Step 4: Update snapshot in `test_tool_surface.py`**

In `test_v1_tool_names_are_exact`, add `"get_instagram_actor_id"` to the set.

In `test_v1_signature_snapshot`, add the new entry (alphabetical order, between `"export_ad_image_file"` and `"list_account_pages"`):

```python
"get_instagram_actor_id": ["facebook_page_id", "meta_access_token"],
```

- [ ] **Step 5: Run all tests**

```bash
uv run pytest --tb=short
```

Expected: all 52 pass (48 + 3 new instagram tests + 1 snapshot already counted)

- [ ] **Step 6: Commit**

```bash
git add src/armavita_meta_ads_mcp/core/ad_tools.py tests/test_instagram_actor_id.py tests/test_tool_surface.py
git commit -m "feat: add get_instagram_actor_id tool to resolve page-scoped actor ID"
```

---

## Task 5: BUG-3 — Add carousel creative support to `create_ad_creative`

**Files:**
- Modify: `src/armavita_meta_ads_mcp/core/ad_tools.py`
- Modify: `tests/test_creative_payloads.py`
- Modify: `tests/test_tool_surface.py`

- [ ] **Step 1: Write the failing test**

Add to `tests/test_creative_payloads.py`:

```python
@pytest.mark.asyncio
async def test_create_ad_creative_carousel_builds_child_attachments():
    with patch("armavita_meta_ads_mcp.core.ad_tools.make_api_request", new_callable=AsyncMock) as mock_api:
        mock_api.side_effect = [{"id": "creative_3"}, {"id": "creative_3", "name": "Carousel"}]

        raw = await create_ad_creative(
            ad_account_id="act_123",
            facebook_page_id="123456",
            link_url="https://example.com",
            primary_text="Shop our collection",
            carousel_cards=[
                {
                    "image_hash": "hash_card_1",
                    "link": "https://example.com/product-1",
                    "name": "Product 1",
                    "description": "Best seller",
                    "call_to_action": {"type": "SHOP_NOW"},
                },
                {
                    "image_hash": "hash_card_2",
                    "link": "https://example.com/product-2",
                    "name": "Product 2",
                },
            ],
            meta_access_token="token",
        )

    payload = json.loads(raw)
    assert payload["success"] is True

    params = mock_api.call_args_list[0].args[2]
    story = params["object_story_spec"]
    assert story["page_id"] == "123456"
    link_data = story["link_data"]
    assert link_data["link"] == "https://example.com"
    assert link_data["message"] == "Shop our collection"

    children = link_data["child_attachments"]
    assert len(children) == 2
    assert children[0]["image_hash"] == "hash_card_1"
    assert children[0]["link"] == "https://example.com/product-1"
    assert children[0]["name"] == "Product 1"
    assert children[0]["description"] == "Best seller"
    assert children[0]["call_to_action"] == {"type": "SHOP_NOW"}
    assert children[1]["image_hash"] == "hash_card_2"
    assert "description" not in children[1]


@pytest.mark.asyncio
async def test_create_ad_creative_carousel_requires_at_least_two_cards():
    raw = await create_ad_creative(
        ad_account_id="act_123",
        facebook_page_id="123456",
        link_url="https://example.com",
        carousel_cards=[{"image_hash": "hash_1", "link": "https://example.com/p1"}],
        meta_access_token="token",
    )
    payload = json.loads(raw)
    assert "error" in payload
    assert "2" in payload["error"]


@pytest.mark.asyncio
async def test_create_ad_creative_carousel_rejects_mixed_media():
    """carousel_cards and ad_image_hash are mutually exclusive."""
    raw = await create_ad_creative(
        ad_account_id="act_123",
        facebook_page_id="123456",
        link_url="https://example.com",
        ad_image_hash="standalone_hash",
        carousel_cards=[
            {"image_hash": "c1", "link": "https://example.com/1"},
            {"image_hash": "c2", "link": "https://example.com/2"},
        ],
        meta_access_token="token",
    )
    payload = json.loads(raw)
    assert "error" in payload
```

- [ ] **Step 2: Run tests to confirm all three fail**

```bash
uv run pytest tests/test_creative_payloads.py -v
```

Expected: the 2 original pass, the 3 new ones FAIL with `unexpected keyword argument 'carousel_cards'`.

- [ ] **Step 3: Implement carousel support in `ad_tools.py`**

**3a. Add `_build_carousel_story_spec` helper** (add near the other `_build_simple_*` helpers around line 838):

```python
def _build_carousel_story_spec(
    facebook_page_id: str,
    link_url: str,
    primary_text: Optional[str],
    carousel_cards: List[Dict[str, Any]],
) -> Dict[str, Any]:
    children = []
    for card in carousel_cards:
        attachment: Dict[str, Any] = {
            "image_hash": card["image_hash"],
            "link": card["link"],
        }
        if card.get("name"):
            attachment["name"] = card["name"]
        if card.get("description"):
            attachment["description"] = card["description"]
        if card.get("call_to_action"):
            attachment["call_to_action"] = card["call_to_action"]
        children.append(attachment)

    link_data: Dict[str, Any] = {
        "link": link_url,
        "child_attachments": children,
        "multi_share_optimized": True,
    }
    if primary_text:
        link_data["message"] = primary_text

    return {
        "page_id": facebook_page_id,
        "link_data": link_data,
    }
```

**3b. Add `carousel_cards` parameter to `create_ad_creative`** (add after `asset_customization_rules`):

```python
    carousel_cards: Optional[List[Dict[str, Any]]] = None,
```

**3c+3d. Atomic replacement — do both edits together.**

**Replace** the single existing line (around line 1034):
```python
    media_error = _ensure_single_media_choice(ad_image_hash, ad_image_hashes, ad_video_id)
    if media_error:
        return _json({"error": media_error})
```

**With** the gated version + carousel validation:
```python
    if carousel_cards is not None:
        if ad_image_hash or ad_image_hashes or ad_video_id:
            return _json({"error": "carousel_cards cannot be combined with ad_image_hash, ad_image_hashes, or ad_video_id"})
        if len(carousel_cards) < 2:
            return _json({"error": "carousel_cards requires at least 2 cards"})
        if len(carousel_cards) > 10:
            return _json({"error": "carousel_cards maximum is 10 cards"})
        for i, card in enumerate(carousel_cards):
            if not card.get("image_hash"):
                return _json({"error": f"carousel_cards[{i}] missing required field: image_hash"})
            if not card.get("link"):
                return _json({"error": f"carousel_cards[{i}] missing required field: link"})
    else:
        media_error = _ensure_single_media_choice(ad_image_hash, ad_image_hashes, ad_video_id)
        if media_error:
            return _json({"error": media_error})
```

**Then replace** the entire `if use_asset_feed: ... else:` block (lines ~1087–1125) with the full three-branch version. The complete replacement (all indentation is 4 spaces):

```python
    if carousel_cards is not None:
        creative_payload["object_story_spec"] = _build_carousel_story_spec(
            facebook_page_id=resolved_page_id,
            link_url=link_url,
            primary_text=primary_text,
            carousel_cards=carousel_cards,
        )
    elif use_asset_feed:
        feed, story_spec = _build_asset_feed_spec_payload(
            link_url=link_url,
            normalized_assets=normalized_assets,
            ad_image_hash=ad_image_hash,
            ad_image_hashes=ad_image_hashes,
            ad_video_id=ad_video_id,
            thumbnail_url=thumbnail_url,
            optimization_type=optimization_type,
            ad_formats=ad_formats,
            call_to_action_type=call_to_action_type,
            asset_customization_rules=asset_customization_rules,
        )
        story_spec["page_id"] = resolved_page_id
        creative_payload["asset_feed_spec"] = feed
        creative_payload["object_story_spec"] = story_spec
    else:
        if ad_video_id:
            creative_payload["object_story_spec"] = _build_simple_video_story_spec(
                facebook_page_id=resolved_page_id,
                ad_video_id=ad_video_id,
                link_url=link_url,
                primary_text=primary_text,
                headline_text=headline_text,
                thumbnail_url=thumbnail_url,
                call_to_action_type=call_to_action_type,
                lead_form_id=lead_form_id,
            )
        else:
            creative_payload["object_story_spec"] = _build_simple_image_story_spec(
                facebook_page_id=resolved_page_id,
                ad_image_hash=ad_image_hash,
                link_url=link_url,
                primary_text=primary_text,
                headline_text=headline_text,
                description_text=description_text,
                call_to_action_type=call_to_action_type,
                lead_form_id=lead_form_id,
            )
```

- [ ] **Step 4: Update snapshot in `test_tool_surface.py`**

Find `"create_ad_creative"` in `test_v1_signature_snapshot` and add `"carousel_cards"` after `"asset_customization_rules"`:

```python
"create_ad_creative": [
    "ad_account_id",
    "ad_image_hash",
    "meta_access_token",
    "name",
    "facebook_page_id",
    "link_url",
    "primary_text",
    "primary_text_variants",
    "headline_text",
    "headline_variants",
    "description_text",
    "description_variants",
    "ad_image_hashes",
    "ad_video_id",
    "thumbnail_url",
    "optimization_type",
    "dynamic_creative_spec",
    "call_to_action_type",
    "lead_form_id",
    "instagram_actor_id",
    "ad_formats",
    "asset_customization_rules",
    "carousel_cards",    # <-- added
],
```

- [ ] **Step 5: Run all tests**

```bash
uv run pytest --tb=short
```

Expected: all 55 pass

- [ ] **Step 6: Commit**

```bash
git add src/armavita_meta_ads_mcp/core/ad_tools.py tests/test_creative_payloads.py tests/test_tool_surface.py
git commit -m "feat: add carousel_cards support to create_ad_creative"
```

---

## Task 6: Fix `datetime.utcnow()` deprecation in `report_tools.py`

**Files:**
- Modify: `src/armavita_meta_ads_mcp/core/report_tools.py:272`

This is a one-line fix. No new test needed — the existing test `test_create_report_normalizes_previous_30d_alias` already exercises this line, and the deprecation warning will disappear from pytest output.

- [ ] **Step 1: Apply fix**

In `report_tools.py`, find line 272:

```python
generated_at = datetime.datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
```

Replace with:

```python
generated_at = datetime.datetime.now(datetime.timezone.utc).replace(microsecond=0, tzinfo=None).isoformat() + "Z"
```

- [ ] **Step 2: Run tests and verify warning is gone**

```bash
uv run pytest tests/test_report_query_params.py -v
```

Expected: 4 PASS, 0 warnings (the `DeprecationWarning: datetime.datetime.utcnow()` line should be absent).

- [ ] **Step 3: Run full suite**

```bash
uv run pytest --tb=short
```

Expected: all 55 pass, 0 warnings

- [ ] **Step 4: Commit**

```bash
git add src/armavita_meta_ads_mcp/core/report_tools.py
git commit -m "fix: replace deprecated datetime.utcnow() with timezone-aware equivalent"
```

---

## Final Verification

- [ ] **Run full test suite one last time**

```bash
uv run pytest -v --tb=short
```

Expected output summary: `55 passed, 0 warnings`

- [ ] **Verify all bugs from INVESTIGATION.md are addressed**

| Bug | Status |
|---|---|
| BUG-1: local file upload | Fixed in Task 3 |
| BUG-2: instagram_actor_id format | Addressed in Task 4 (new resolution tool) |
| BUG-3: no carousel support | Fixed in Task 5 |
| BUG-4: promoted_object on update_ad_set | Fixed in Task 2 |
| BUG-5: frequency_control_specs on create_ad_set | Fixed in Task 1 |
| Logging deprecation | Fixed in Task 6 |
