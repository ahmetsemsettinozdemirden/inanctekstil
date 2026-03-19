# Meta Ads MCP Extensions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5 capability areas missing from the Meta Ads MCP — Custom Audiences, Ad Videos, Pixels, Delete Operations, and Ad Rules — bringing the MCP to full autonomous-agent capability.

**Architecture:** Each capability area is its own new `*_tools.py` file in `src/armavita_meta_ads_mcp/core/`, registered in `mcp_runtime.py`, and tested with a matching `tests/test_*.py`. All tools follow the identical decorator + `make_api_request` pattern used throughout the codebase. Video upload is the only exception — it requires a raw `httpx` multipart call because Meta's API does not accept base64 for video.

**Tech Stack:** Python 3.11, FastMCP, httpx, pytest + pytest-asyncio, Meta Graph API v25.0

---

## Meta API Reference Summary

All endpoints use base `https://graph.facebook.com/v25.0` (constant `META_GRAPH_API_BASE`).

### Custom Audiences
- `GET  /act_{id}/customaudiences` — list, fields: `id,name,subtype,approximate_count_lower_bound,approximate_count_upper_bound,delivery_status,operation_status,time_created,time_updated`
- `POST /act_{id}/customaudiences` — create; required: `name`, `subtype`; optional: `description`, `retention_days`, `customer_file_source`
- `GET  /{audience_id}` — read one
- `DELETE /{audience_id}` — delete
- `POST /{audience_id}/users` — add users; payload: `schema` (array of field names), `data` (array of arrays), `is_raw` (bool)
- `DELETE /{audience_id}/users` — remove users; same payload shape
- Lookalike create: `POST /act_{id}/customaudiences` with `subtype=LOOKALIKE`, `lookalike_spec={"origin_audience_id":"...","ratio":0.01,"country":"TR"}`

### Ad Videos
- `POST /act_{id}/advideos` — multipart upload; fields: `source` (binary), `title`, `description`; response: `{"id":"...","video_id":"...","success":true}`
- `GET  /act_{id}/advideos` — list; fields: `id,title,description,status,created_time,length,thumbnails`
- `GET  /{video_id}` — read one

### Pixels
- `GET  /act_{id}/adspixels` — list; fields: `id,name,creation_time,last_fired_time`
- `GET  /{pixel_id}` — read; fields: `id,name,code,creation_time,last_fired_time,owner_business`

### Delete Operations
- `DELETE /{campaign_id}` — delete campaign (must be PAUSED or ARCHIVED first)
- `DELETE /{ad_set_id}` — delete ad set
- `DELETE /{ad_id}` — delete ad
- All return `{"success": true}` on success

### Ad Rules
- `POST /act_{id}/adrules_library` — create rule; required: `name`, `evaluation_spec`, `execution_spec`; optional: `schedule_spec`
- `GET  /act_{id}/adrules_library` — list rules
- `GET  /{rule_id}` — read one
- `POST /{rule_id}` — update
- `DELETE /{rule_id}` — delete
- `POST /{rule_id}/execute` — run rule immediately

#### Rule field reference
- `evaluation_spec`: `{"evaluation_type": "SCHEDULE"|"TRIGGER", "filters": [{"field":"spend","value":[100],"operator":"GREATER_THAN"}]}`
- `execution_spec`: `{"execution_type": "PAUSE"|"UNPAUSE"|"CHANGE_BUDGET"|"CHANGE_BID"|"NOTIFICATION", "execution_options": [{"field":"budget","value":"10","operator":"MULTIPLY"}]}`
- `schedule_spec`: `{"schedule_type": "DAILY"|"HOURLY"|"SEMI_HOURLY", "scheduled_spec": {"days": [1,2,3,4,5]}}`

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/armavita_meta_ads_mcp/core/audience_tools.py` | Custom + lookalike audience CRUD |
| Create | `src/armavita_meta_ads_mcp/core/video_tools.py` | Ad video upload + list |
| Create | `src/armavita_meta_ads_mcp/core/pixel_tools.py` | Pixel list + read |
| Create | `src/armavita_meta_ads_mcp/core/delete_tools.py` | Delete campaign/adset/ad |
| Create | `src/armavita_meta_ads_mcp/core/rule_tools.py` | Ad rules CRUD + execute |
| Modify | `src/armavita_meta_ads_mcp/core/mcp_runtime.py` | Register 5 new modules |
| Modify | `tests/test_tool_surface.py` | Add 18 new tools to registry snapshot |
| Create | `tests/test_audience_tools.py` | Tests for audience tools |
| Create | `tests/test_video_tools.py` | Tests for video tools |
| Create | `tests/test_pixel_tools.py` | Tests for pixel tools |
| Create | `tests/test_delete_tools.py` | Tests for delete tools |
| Create | `tests/test_rule_tools.py` | Tests for rule tools |

All paths are relative to `technical/meta-ads/armavita-meta-ads-mcp/`.

---

## Conventions (read before writing any code)

```python
# Every tool file header
# Copyright (C) 2025 ArmaVita LLC
# SPDX-License-Identifier: AGPL-3.0-only

# Standard imports
import json
from typing import Any, Dict, List, Optional
from .graph_client import make_api_request, meta_api_tool
from .mcp_runtime import mcp_server

# Every file defines this helper
def _json(payload: Dict[str, Any]) -> str:
    return json.dumps(payload, indent=2)

# Every tool signature
@mcp_server.tool()
@meta_api_tool
async def tool_name(
    required_id: str,
    meta_access_token: Optional[str] = None,
    optional_param: Optional[str] = None,
) -> str:
    """One-line docstring."""
    if not required_id:
        return _json({"error": "No ID provided"})
    ...
```

```python
# Standard test header
import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

# Patch target is always: armavita_meta_ads_mcp.core.<module>.<function>
# e.g. "armavita_meta_ads_mcp.core.audience_tools.make_api_request"
```

---

## Task 1: Custom Audience CRUD + User Management

**New tools:** `list_custom_audiences`, `read_custom_audience`, `create_custom_audience`, `delete_custom_audience`, `add_users_to_audience`, `remove_users_from_audience`

**Files:**
- Create: `src/armavita_meta_ads_mcp/core/audience_tools.py`
- Create: `tests/test_audience_tools.py`

- [ ] **Step 1.1: Write failing tests**

```python
# tests/test_audience_tools.py
import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from armavita_meta_ads_mcp.core.audience_tools import (
    create_custom_audience,
    delete_custom_audience,
    list_custom_audiences,
    read_custom_audience,
    add_users_to_audience,
    remove_users_from_audience,
)

PATCH = "armavita_meta_ads_mcp.core.audience_tools.make_api_request"


@pytest.mark.asyncio
async def test_list_custom_audiences_passes_correct_endpoint():
    with patch(PATCH, new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"data": []}
        result = await list_custom_audiences(
            ad_account_id="act_123", meta_access_token="tok"
        )
    payload = json.loads(result)
    assert payload == {"data": []}
    endpoint = mock_api.call_args.args[0]
    assert endpoint == "act_123/customaudiences"


@pytest.mark.asyncio
async def test_list_custom_audiences_requires_account_id():
    result = await list_custom_audiences(
        ad_account_id="", meta_access_token="tok"
    )
    assert "error" in json.loads(result)


@pytest.mark.asyncio
async def test_create_custom_audience_sends_name_and_subtype():
    with patch(PATCH, new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"id": "999"}
        result = await create_custom_audience(
            ad_account_id="act_123",
            name="Test Audience",
            subtype="CUSTOM",
            meta_access_token="tok",
        )
    payload = json.loads(result)
    assert payload["id"] == "999"
    sent = mock_api.call_args.args[2]
    assert sent["name"] == "Test Audience"
    assert sent["subtype"] == "CUSTOM"


@pytest.mark.asyncio
async def test_create_custom_audience_requires_name():
    result = await create_custom_audience(
        ad_account_id="act_123", name="", subtype="CUSTOM", meta_access_token="tok"
    )
    assert "error" in json.loads(result)


@pytest.mark.asyncio
async def test_create_lookalike_sends_lookalike_spec():
    with patch(PATCH, new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"id": "456"}
        result = await create_custom_audience(
            ad_account_id="act_123",
            name="Lookalike TR 1%",
            subtype="LOOKALIKE",
            lookalike_spec={"origin_audience_id": "111", "ratio": 0.01, "country": "TR"},
            meta_access_token="tok",
        )
    sent = mock_api.call_args.args[2]
    spec = json.loads(sent["lookalike_spec"])
    assert spec["ratio"] == 0.01
    assert spec["country"] == "TR"


@pytest.mark.asyncio
async def test_delete_custom_audience_calls_delete_method():
    with patch(PATCH, new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"success": True}
        result = await delete_custom_audience(
            audience_id="777", meta_access_token="tok"
        )
    assert json.loads(result)["success"] is True
    method = mock_api.call_args.kwargs.get("method")
    assert method == "DELETE"


@pytest.mark.asyncio
async def test_add_users_to_audience_sends_schema_and_data():
    with patch(PATCH, new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"num_received": 2, "num_invalid_entries": 0}
        result = await add_users_to_audience(
            audience_id="777",
            schema=["EMAIL"],
            data=[["a@b.com"], ["c@d.com"]],
            meta_access_token="tok",
        )
    sent = mock_api.call_args.args[2]
    payload = json.loads(sent["payload"])
    assert payload["schema"] == ["EMAIL"]
    assert len(payload["data"]) == 2


@pytest.mark.asyncio
async def test_remove_users_from_audience_calls_delete_method():
    with patch(PATCH, new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"num_received": 1}
        await remove_users_from_audience(
            audience_id="777",
            schema=["EMAIL"],
            data=[["a@b.com"]],
            meta_access_token="tok",
        )
    method = mock_api.call_args.kwargs.get("method")
    assert method == "DELETE"
```

- [ ] **Step 1.2: Run tests to verify they fail**

```bash
cd technical/meta-ads/armavita-meta-ads-mcp
source .venv/bin/activate
pytest tests/test_audience_tools.py -v 2>&1 | head -30
```

Expected: `ImportError` or `ModuleNotFoundError` — `audience_tools` does not exist yet.

- [ ] **Step 1.3: Implement `audience_tools.py`**

```python
# src/armavita_meta_ads_mcp/core/audience_tools.py
# Copyright (C) 2025 ArmaVita LLC
# SPDX-License-Identifier: AGPL-3.0-only

"""Custom and lookalike audience management tools."""

import json
from typing import Any, Dict, List, Optional

from .graph_client import make_api_request, meta_api_tool
from .mcp_runtime import mcp_server

_AUDIENCE_FIELDS = (
    "id,name,subtype,description,approximate_count_lower_bound,"
    "approximate_count_upper_bound,delivery_status,operation_status,"
    "time_created,time_updated,customer_file_source,pixel_id"
)


def _json(payload: Dict[str, Any]) -> str:
    return json.dumps(payload, indent=2)


@mcp_server.tool()
@meta_api_tool
async def list_custom_audiences(
    ad_account_id: str,
    meta_access_token: Optional[str] = None,
    page_size: int = 20,
    page_cursor: str = "",
) -> str:
    """List custom and lookalike audiences for an ad account."""
    if not ad_account_id:
        return _json({"error": "No account ID provided"})

    params: Dict[str, Any] = {"fields": _AUDIENCE_FIELDS, "limit": page_size}
    if page_cursor:
        params["after"] = page_cursor

    payload = await make_api_request(
        f"{ad_account_id}/customaudiences", meta_access_token, params
    )
    return _json(payload)


@mcp_server.tool()
@meta_api_tool
async def read_custom_audience(
    audience_id: str,
    meta_access_token: Optional[str] = None,
) -> str:
    """Fetch full details for one custom audience."""
    if not audience_id:
        return _json({"error": "No audience ID provided"})

    payload = await make_api_request(
        audience_id,
        meta_access_token,
        {"fields": _AUDIENCE_FIELDS + ",rule,lookalike_audience_ids,sharing_status"},
    )
    return _json(payload)


@mcp_server.tool()
@meta_api_tool
async def create_custom_audience(
    ad_account_id: str,
    name: str,
    subtype: str,
    meta_access_token: Optional[str] = None,
    description: Optional[str] = None,
    retention_days: Optional[int] = None,
    customer_file_source: Optional[str] = None,
    lookalike_spec: Optional[Dict[str, Any]] = None,
    rule: Optional[Dict[str, Any]] = None,
    pixel_id: Optional[str] = None,
) -> str:
    """Create a custom audience (CUSTOM, WEBSITE, LOOKALIKE, ENGAGEMENT).

    For LOOKALIKE audiences, provide lookalike_spec with:
      origin_audience_id, ratio (0.01-0.20), country (e.g. "TR")

    For WEBSITE audiences, provide pixel_id and retention_days.

    subtype values: CUSTOM, WEBSITE, LOOKALIKE, ENGAGEMENT, APP, OFFLINE_CONVERSION
    """
    if not ad_account_id:
        return _json({"error": "No account ID provided"})
    if not name:
        return _json({"error": "No audience name provided"})
    if not subtype:
        return _json({"error": "No subtype provided"})

    payload: Dict[str, Any] = {"name": name, "subtype": subtype}

    if description:
        payload["description"] = description
    if retention_days is not None:
        payload["retention_days"] = str(retention_days)
    if customer_file_source:
        payload["customer_file_source"] = customer_file_source
    if lookalike_spec is not None:
        payload["lookalike_spec"] = json.dumps(lookalike_spec)
    if rule is not None:
        payload["rule"] = json.dumps(rule)
    if pixel_id:
        payload["pixel_id"] = pixel_id

    result = await make_api_request(
        f"{ad_account_id}/customaudiences", meta_access_token, payload, method="POST"
    )
    return _json(result)


@mcp_server.tool()
@meta_api_tool
async def delete_custom_audience(
    audience_id: str,
    meta_access_token: Optional[str] = None,
) -> str:
    """Permanently delete a custom audience. Stops associated ads from running."""
    if not audience_id:
        return _json({"error": "No audience ID provided"})

    result = await make_api_request(
        audience_id, meta_access_token, {}, method="DELETE"
    )
    return _json(result)


@mcp_server.tool()
@meta_api_tool
async def add_users_to_audience(
    audience_id: str,
    schema: List[str],
    data: List[List[str]],
    meta_access_token: Optional[str] = None,
    is_raw: bool = True,
) -> str:
    """Add users to a custom audience.

    schema: list of field names, e.g. ["EMAIL"], ["PHONE"], ["EMAIL","FN","LN"]
    data: list of rows matching the schema, e.g. [["user@example.com"]]
    is_raw: if True, Meta will hash the values. Set False if pre-hashed (SHA-256).

    Returns num_received and num_invalid_entries.
    """
    if not audience_id:
        return _json({"error": "No audience ID provided"})
    if not schema or not data:
        return _json({"error": "schema and data are required"})

    params: Dict[str, Any] = {
        "payload": json.dumps({"schema": schema, "data": data, "is_raw": is_raw})
    }
    result = await make_api_request(
        f"{audience_id}/users", meta_access_token, params, method="POST"
    )
    return _json(result)


@mcp_server.tool()
@meta_api_tool
async def remove_users_from_audience(
    audience_id: str,
    schema: List[str],
    data: List[List[str]],
    meta_access_token: Optional[str] = None,
    is_raw: bool = True,
) -> str:
    """Remove users from a custom audience.

    Same schema/data format as add_users_to_audience.
    """
    if not audience_id:
        return _json({"error": "No audience ID provided"})
    if not schema or not data:
        return _json({"error": "schema and data are required"})

    params: Dict[str, Any] = {
        "payload": json.dumps({"schema": schema, "data": data, "is_raw": is_raw})
    }
    result = await make_api_request(
        f"{audience_id}/users", meta_access_token, params, method="DELETE"
    )
    return _json(result)
```

- [ ] **Step 1.4: Run tests to verify they pass**

```bash
pytest tests/test_audience_tools.py -v
```

Expected: all 8 tests PASS.

- [ ] **Step 1.5: Register module in mcp_runtime.py**

In `src/armavita_meta_ads_mcp/core/mcp_runtime.py`, find `_import_tool_modules` and add `audience_tools`:

```python
def _import_tool_modules() -> None:
    from . import (  # noqa: F401
        account_tools,
        ad_tools,
        adset_tools,
        ads_archive_tools,
        audience_tools,          # <- add this
        budget_schedule_tools,
        campaign_tools,
        duplication_tools,
        insight_tools,
        report_tools,
        research_tools,
        targeting_tools,
    )
```

- [ ] **Step 1.6: Commit**

```bash
git add src/armavita_meta_ads_mcp/core/audience_tools.py \
        src/armavita_meta_ads_mcp/core/mcp_runtime.py \
        tests/test_audience_tools.py
git commit -m "feat(mcp): add custom audience CRUD and user management tools"
```

---

## Task 2: Ad Video Upload and Listing

**New tools:** `upload_ad_video`, `list_ad_videos`, `read_ad_video`

**Files:**
- Create: `src/armavita_meta_ads_mcp/core/video_tools.py`
- Create: `tests/test_video_tools.py`

**Important:** Video upload uses raw `httpx` multipart (not `make_api_request`) because Meta's API requires binary `source` in a multipart body. The `graph_client` helper only sends `data=` (form fields). Import `httpx` and construct the request directly.

- [ ] **Step 2.1: Write failing tests**

```python
# tests/test_video_tools.py
import json
import sys
import tempfile
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from armavita_meta_ads_mcp.core.video_tools import (
    list_ad_videos,
    read_ad_video,
    upload_ad_video,
)

LIST_PATCH = "armavita_meta_ads_mcp.core.video_tools.make_api_request"


@pytest.mark.asyncio
async def test_upload_ad_video_reads_file_bytes():
    """Video upload must open and send actual file bytes via multipart, not a path string."""
    fake_bytes = b"\x00\x00\x00\x18ftypmp42"  # fake MP4 header

    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
        f.write(fake_bytes)
        tmp_path = f.name

    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json = MagicMock(return_value={"id": "99", "success": True})

    with patch("armavita_meta_ads_mcp.core.video_tools.httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client_cls.return_value = mock_client

        result = await upload_ad_video(
            ad_account_id="act_123",
            video_file_path=tmp_path,
            title="Test Video",
            meta_access_token="tok",
        )

    payload = json.loads(result)
    assert payload.get("success") is True
    assert payload.get("video_id") == "99"

    # Verify that the `files` kwarg was used (multipart), not `data` alone
    call_kwargs = mock_client.post.call_args.kwargs
    assert "files" in call_kwargs, "Video upload must use multipart files, not form data"


@pytest.mark.asyncio
async def test_upload_ad_video_missing_file_returns_error():
    result = await upload_ad_video(
        ad_account_id="act_123",
        video_file_path="/nonexistent/video.mp4",
        title="Test",
        meta_access_token="tok",
    )
    payload = json.loads(result)
    assert "error" in payload


@pytest.mark.asyncio
async def test_list_ad_videos_passes_correct_endpoint():
    with patch(LIST_PATCH, new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"data": []}
        result = await list_ad_videos(
            ad_account_id="act_123", meta_access_token="tok"
        )
    assert json.loads(result) == {"data": []}
    assert mock_api.call_args.args[0] == "act_123/advideos"


@pytest.mark.asyncio
async def test_read_ad_video_requires_id():
    result = await read_ad_video(video_id="", meta_access_token="tok")
    assert "error" in json.loads(result)
```

- [ ] **Step 2.2: Run tests to verify they fail**

```bash
pytest tests/test_video_tools.py -v 2>&1 | head -20
```

Expected: `ImportError`.

- [ ] **Step 2.3: Implement `video_tools.py`**

```python
# src/armavita_meta_ads_mcp/core/video_tools.py
# Copyright (C) 2025 ArmaVita LLC
# SPDX-License-Identifier: AGPL-3.0-only

"""Ad video upload and management tools."""

import json
from pathlib import Path
from typing import Any, Dict, Optional

import httpx

from .graph_client import USER_AGENT, make_api_request, meta_api_tool
from .graph_constants import META_GRAPH_API_BASE
from .mcp_runtime import mcp_server

_VIDEO_FIELDS = "id,title,description,status,created_time,length,thumbnails"


def _json(payload: Dict[str, Any]) -> str:
    return json.dumps(payload, indent=2)


@mcp_server.tool()
@meta_api_tool
async def upload_ad_video(
    ad_account_id: str,
    video_file_path: str,
    title: str,
    meta_access_token: Optional[str] = None,
    description: Optional[str] = None,
) -> str:
    """Upload a local video file as an ad video asset.

    Returns video_id for use in create_ad_creative (ad_video_id field).
    video_file_path: absolute path to a local .mp4 file.
    """
    if not ad_account_id:
        return _json({"error": "No account ID provided"})
    if not title:
        return _json({"error": "No video title provided"})
    if not video_file_path:
        return _json({"error": "No video_file_path provided"})

    path = Path(video_file_path)
    if not path.exists():
        return _json({
            "error": f"File not found: {video_file_path}",
            "video_file_path": video_file_path,
        })

    url = f"{META_GRAPH_API_BASE}/{ad_account_id}/advideos"

    data_fields = {"access_token": meta_access_token, "title": title}
    if description:
        data_fields["description"] = description

    try:
        with open(path, "rb") as f:
            video_bytes = f.read()

        files = {"source": (path.name, video_bytes, "video/mp4")}

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                url,
                data=data_fields,
                files=files,
                headers={"User-Agent": USER_AGENT},
            )
            response.raise_for_status()
            raw = response.json()

    except FileNotFoundError:
        return _json({"error": f"File not found: {video_file_path}", "video_file_path": video_file_path})
    except httpx.HTTPStatusError as exc:
        try:
            error_payload = exc.response.json()
        except Exception:  # noqa: BLE001
            error_payload = {"status_code": exc.response.status_code, "text": exc.response.text}
        return _json({"error": "Failed to upload video", "details": error_payload})
    except Exception as exc:  # noqa: BLE001
        return _json({"error": f"Upload failed: {exc}"})

    video_id = str(raw.get("id") or raw.get("video_id") or "")
    return _json({
        "success": raw.get("success", True),
        "video_id": video_id,
        "ad_account_id": ad_account_id,
        "title": title,
        "raw": raw,
    })


@mcp_server.tool()
@meta_api_tool
async def list_ad_videos(
    ad_account_id: str,
    meta_access_token: Optional[str] = None,
    page_size: int = 10,
    page_cursor: str = "",
) -> str:
    """List ad video assets for an ad account."""
    if not ad_account_id:
        return _json({"error": "No account ID provided"})

    params: Dict[str, Any] = {"fields": _VIDEO_FIELDS, "limit": page_size}
    if page_cursor:
        params["after"] = page_cursor

    payload = await make_api_request(
        f"{ad_account_id}/advideos", meta_access_token, params
    )
    return _json(payload)


@mcp_server.tool()
@meta_api_tool
async def read_ad_video(
    video_id: str,
    meta_access_token: Optional[str] = None,
) -> str:
    """Fetch details for one ad video by ID."""
    if not video_id:
        return _json({"error": "No video ID provided"})

    payload = await make_api_request(
        video_id,
        meta_access_token,
        {"fields": _VIDEO_FIELDS + ",embed_html,format,live_status"},
    )
    return _json(payload)
```

- [ ] **Step 2.4: Run tests to verify they pass**

```bash
pytest tests/test_video_tools.py -v
```

Expected: all 4 tests PASS.

- [ ] **Step 2.5: Register module in mcp_runtime.py**

Add `video_tools` to `_import_tool_modules`.

- [ ] **Step 2.6: Commit**

```bash
git add src/armavita_meta_ads_mcp/core/video_tools.py \
        src/armavita_meta_ads_mcp/core/mcp_runtime.py \
        tests/test_video_tools.py
git commit -m "feat(mcp): add ad video upload, list, and read tools"
```

---

## Task 3: Pixel List and Read

**New tools:** `list_pixels`, `read_pixel`

**Files:**
- Create: `src/armavita_meta_ads_mcp/core/pixel_tools.py`
- Create: `tests/test_pixel_tools.py`

- [ ] **Step 3.1: Write failing tests**

```python
# tests/test_pixel_tools.py
import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from armavita_meta_ads_mcp.core.pixel_tools import list_pixels, read_pixel

PATCH = "armavita_meta_ads_mcp.core.pixel_tools.make_api_request"


@pytest.mark.asyncio
async def test_list_pixels_passes_correct_endpoint():
    with patch(PATCH, new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"data": [{"id": "111", "name": "Main Pixel"}]}
        result = await list_pixels(ad_account_id="act_123", meta_access_token="tok")
    payload = json.loads(result)
    assert payload["data"][0]["id"] == "111"
    assert mock_api.call_args.args[0] == "act_123/adspixels"


@pytest.mark.asyncio
async def test_list_pixels_requires_account_id():
    result = await list_pixels(ad_account_id="", meta_access_token="tok")
    assert "error" in json.loads(result)


@pytest.mark.asyncio
async def test_read_pixel_passes_correct_endpoint():
    with patch(PATCH, new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"id": "111", "name": "Main Pixel", "code": "<!-- pixel js -->"}
        result = await read_pixel(pixel_id="111", meta_access_token="tok")
    payload = json.loads(result)
    assert payload["id"] == "111"
    assert mock_api.call_args.args[0] == "111"


@pytest.mark.asyncio
async def test_read_pixel_requires_id():
    result = await read_pixel(pixel_id="", meta_access_token="tok")
    assert "error" in json.loads(result)
```

- [ ] **Step 3.2: Run tests to verify they fail**

```bash
pytest tests/test_pixel_tools.py -v 2>&1 | head -20
```

Expected: `ImportError`.

- [ ] **Step 3.3: Implement `pixel_tools.py`**

```python
# src/armavita_meta_ads_mcp/core/pixel_tools.py
# Copyright (C) 2025 ArmaVita LLC
# SPDX-License-Identifier: AGPL-3.0-only

"""Facebook Ads Pixel read tools."""

import json
from typing import Any, Dict, Optional

from .graph_client import make_api_request, meta_api_tool
from .mcp_runtime import mcp_server

_PIXEL_LIST_FIELDS = "id,name,creation_time,last_fired_time"
_PIXEL_DETAIL_FIELDS = "id,name,code,creation_time,last_fired_time,owner_business"


def _json(payload: Dict[str, Any]) -> str:
    return json.dumps(payload, indent=2)


@mcp_server.tool()
@meta_api_tool
async def list_pixels(
    ad_account_id: str,
    meta_access_token: Optional[str] = None,
) -> str:
    """List Facebook Pixels associated with an ad account."""
    if not ad_account_id:
        return _json({"error": "No account ID provided"})

    payload = await make_api_request(
        f"{ad_account_id}/adspixels",
        meta_access_token,
        {"fields": _PIXEL_LIST_FIELDS},
    )
    return _json(payload)


@mcp_server.tool()
@meta_api_tool
async def read_pixel(
    pixel_id: str,
    meta_access_token: Optional[str] = None,
) -> str:
    """Fetch full details for one pixel including its JavaScript code snippet."""
    if not pixel_id:
        return _json({"error": "No pixel ID provided"})

    payload = await make_api_request(
        pixel_id,
        meta_access_token,
        {"fields": _PIXEL_DETAIL_FIELDS},
    )
    return _json(payload)
```

- [ ] **Step 3.4: Run tests to verify they pass**

```bash
pytest tests/test_pixel_tools.py -v
```

Expected: all 4 tests PASS.

- [ ] **Step 3.5: Register module in mcp_runtime.py**

Add `pixel_tools` to `_import_tool_modules`.

- [ ] **Step 3.6: Commit**

```bash
git add src/armavita_meta_ads_mcp/core/pixel_tools.py \
        src/armavita_meta_ads_mcp/core/mcp_runtime.py \
        tests/test_pixel_tools.py
git commit -m "feat(mcp): add pixel list and read tools"
```

---

## Task 4: Delete Operations

**New tools:** `delete_campaign`, `delete_ad_set`, `delete_ad`

**Files:**
- Create: `src/armavita_meta_ads_mcp/core/delete_tools.py`
- Create: `tests/test_delete_tools.py`

**Note:** Meta requires campaigns to be PAUSED or ARCHIVED before deletion. The tools include a warning in their docstring but do not enforce this — the API will return an error if the object is active, which surfaces naturally.

- [ ] **Step 4.1: Write failing tests**

```python
# tests/test_delete_tools.py
import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from armavita_meta_ads_mcp.core.delete_tools import delete_ad, delete_ad_set, delete_campaign

PATCH = "armavita_meta_ads_mcp.core.delete_tools.make_api_request"


@pytest.mark.asyncio
async def test_delete_campaign_calls_delete_method():
    with patch(PATCH, new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"success": True}
        result = await delete_campaign(campaign_id="123", meta_access_token="tok")
    assert json.loads(result)["success"] is True
    method = mock_api.call_args.kwargs.get("method")
    assert method == "DELETE"
    assert mock_api.call_args.args[0] == "123"


@pytest.mark.asyncio
async def test_delete_campaign_requires_id():
    result = await delete_campaign(campaign_id="", meta_access_token="tok")
    assert "error" in json.loads(result)


@pytest.mark.asyncio
async def test_delete_ad_set_calls_delete_method():
    with patch(PATCH, new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"success": True}
        result = await delete_ad_set(ad_set_id="456", meta_access_token="tok")
    method = mock_api.call_args.kwargs.get("method")
    assert method == "DELETE"


@pytest.mark.asyncio
async def test_delete_ad_requires_id():
    result = await delete_ad(ad_id="", meta_access_token="tok")
    assert "error" in json.loads(result)


@pytest.mark.asyncio
async def test_delete_ad_calls_delete_method():
    with patch(PATCH, new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"success": True}
        result = await delete_ad(ad_id="789", meta_access_token="tok")
    method = mock_api.call_args.kwargs.get("method")
    assert method == "DELETE"
    assert mock_api.call_args.args[0] == "789"
```

- [ ] **Step 4.2: Run tests to verify they fail**

```bash
pytest tests/test_delete_tools.py -v 2>&1 | head -20
```

Expected: `ImportError`.

- [ ] **Step 4.3: Implement `delete_tools.py`**

```python
# src/armavita_meta_ads_mcp/core/delete_tools.py
# Copyright (C) 2025 ArmaVita LLC
# SPDX-License-Identifier: AGPL-3.0-only

"""Delete operations for campaigns, ad sets, and ads."""

import json
from typing import Any, Dict, Optional

from .graph_client import make_api_request, meta_api_tool
from .mcp_runtime import mcp_server


def _json(payload: Dict[str, Any]) -> str:
    return json.dumps(payload, indent=2)


@mcp_server.tool()
@meta_api_tool
async def delete_campaign(
    campaign_id: str,
    meta_access_token: Optional[str] = None,
) -> str:
    """Permanently delete a campaign.

    WARNING: The campaign must be PAUSED or ARCHIVED first.
    Deleting a campaign also deletes all its ad sets and ads.
    Use update_campaign(status='ARCHIVED') first if unsure.
    """
    if not campaign_id:
        return _json({"error": "No campaign ID provided"})

    result = await make_api_request(
        campaign_id, meta_access_token, {}, method="DELETE"
    )
    return _json(result)


@mcp_server.tool()
@meta_api_tool
async def delete_ad_set(
    ad_set_id: str,
    meta_access_token: Optional[str] = None,
) -> str:
    """Permanently delete an ad set and all its ads.

    WARNING: The ad set must be PAUSED or ARCHIVED first.
    """
    if not ad_set_id:
        return _json({"error": "No ad set ID provided"})

    result = await make_api_request(
        ad_set_id, meta_access_token, {}, method="DELETE"
    )
    return _json(result)


@mcp_server.tool()
@meta_api_tool
async def delete_ad(
    ad_id: str,
    meta_access_token: Optional[str] = None,
) -> str:
    """Permanently delete an ad.

    WARNING: The ad must be PAUSED or ARCHIVED first.
    """
    if not ad_id:
        return _json({"error": "No ad ID provided"})

    result = await make_api_request(
        ad_id, meta_access_token, {}, method="DELETE"
    )
    return _json(result)
```

- [ ] **Step 4.4: Run tests to verify they pass**

```bash
pytest tests/test_delete_tools.py -v
```

Expected: all 5 tests PASS.

- [ ] **Step 4.5: Register module in mcp_runtime.py**

Add `delete_tools` to `_import_tool_modules`.

- [ ] **Step 4.6: Commit**

```bash
git add src/armavita_meta_ads_mcp/core/delete_tools.py \
        src/armavita_meta_ads_mcp/core/mcp_runtime.py \
        tests/test_delete_tools.py
git commit -m "feat(mcp): add delete operations for campaigns, ad sets, and ads"
```

---

## Task 5: Ad Rules CRUD

**New tools:** `create_ad_rule`, `list_ad_rules`, `read_ad_rule`, `update_ad_rule`, `delete_ad_rule`, `execute_ad_rule`

**Files:**
- Create: `src/armavita_meta_ads_mcp/core/rule_tools.py`
- Create: `tests/test_rule_tools.py`

- [ ] **Step 5.1: Write failing tests**

```python
# tests/test_rule_tools.py
import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from armavita_meta_ads_mcp.core.rule_tools import (
    create_ad_rule,
    delete_ad_rule,
    execute_ad_rule,
    list_ad_rules,
    read_ad_rule,
    update_ad_rule,
)

PATCH = "armavita_meta_ads_mcp.core.rule_tools.make_api_request"

_EVAL_SPEC = {
    "evaluation_type": "SCHEDULE",
    "filters": [{"field": "spend", "value": [100], "operator": "GREATER_THAN"}],
}
_EXEC_SPEC = {"execution_type": "PAUSE"}


@pytest.mark.asyncio
async def test_create_ad_rule_sends_name_and_specs():
    with patch(PATCH, new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"id": "rule_1"}
        result = await create_ad_rule(
            ad_account_id="act_123",
            name="Pause High Spend",
            evaluation_spec=_EVAL_SPEC,
            execution_spec=_EXEC_SPEC,
            meta_access_token="tok",
        )
    payload = json.loads(result)
    assert payload["id"] == "rule_1"
    sent = mock_api.call_args.args[2]
    assert sent["name"] == "Pause High Spend"
    assert json.loads(sent["evaluation_spec"])["evaluation_type"] == "SCHEDULE"
    assert json.loads(sent["execution_spec"])["execution_type"] == "PAUSE"


@pytest.mark.asyncio
async def test_create_ad_rule_requires_name():
    result = await create_ad_rule(
        ad_account_id="act_123",
        name="",
        evaluation_spec=_EVAL_SPEC,
        execution_spec=_EXEC_SPEC,
        meta_access_token="tok",
    )
    assert "error" in json.loads(result)


@pytest.mark.asyncio
async def test_list_ad_rules_endpoint():
    with patch(PATCH, new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"data": []}
        await list_ad_rules(ad_account_id="act_123", meta_access_token="tok")
    assert mock_api.call_args.args[0] == "act_123/adrules_library"


@pytest.mark.asyncio
async def test_delete_ad_rule_uses_delete_method():
    with patch(PATCH, new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"success": True}
        await delete_ad_rule(rule_id="rule_1", meta_access_token="tok")
    method = mock_api.call_args.kwargs.get("method")
    assert method == "DELETE"


@pytest.mark.asyncio
async def test_execute_ad_rule_posts_to_execute_edge():
    with patch(PATCH, new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"success": True}
        await execute_ad_rule(rule_id="rule_1", meta_access_token="tok")
    assert mock_api.call_args.args[0] == "rule_1/execute"
    method = mock_api.call_args.kwargs.get("method")
    assert method == "POST"
```

- [ ] **Step 5.2: Run tests to verify they fail**

```bash
pytest tests/test_rule_tools.py -v 2>&1 | head -20
```

Expected: `ImportError`.

- [ ] **Step 5.3: Implement `rule_tools.py`**

```python
# src/armavita_meta_ads_mcp/core/rule_tools.py
# Copyright (C) 2025 ArmaVita LLC
# SPDX-License-Identifier: AGPL-3.0-only

"""Automated ad rule management tools."""

import json
from typing import Any, Dict, Optional

from .graph_client import make_api_request, meta_api_tool
from .mcp_runtime import mcp_server

_RULE_FIELDS = (
    "id,name,status,evaluation_spec,execution_spec,schedule_spec,"
    "created_time,updated_time"
)


def _json(payload: Dict[str, Any]) -> str:
    return json.dumps(payload, indent=2)


@mcp_server.tool()
@meta_api_tool
async def create_ad_rule(
    ad_account_id: str,
    name: str,
    evaluation_spec: Dict[str, Any],
    execution_spec: Dict[str, Any],
    meta_access_token: Optional[str] = None,
    schedule_spec: Optional[Dict[str, Any]] = None,
    status: str = "ENABLED",
) -> str:
    """Create an automated ad rule.

    evaluation_spec defines WHEN the rule triggers:
      {"evaluation_type": "SCHEDULE",
       "filters": [{"field": "spend", "value": [100], "operator": "GREATER_THAN"}]}
      evaluation_type: SCHEDULE | TRIGGER
      operators: GREATER_THAN, LESS_THAN, EQUAL, IN_RANGE, NOT_IN_RANGE, CONTAIN

    execution_spec defines WHAT action to take:
      {"execution_type": "PAUSE"}
      execution_type: PAUSE | UNPAUSE | CHANGE_BUDGET | CHANGE_BID | NOTIFICATION

    schedule_spec (optional) controls timing for SCHEDULE rules:
      {"schedule_type": "DAILY", "scheduled_spec": {"days": [1,2,3,4,5]}}
      schedule_type: DAILY | HOURLY | SEMI_HOURLY
    """
    if not ad_account_id:
        return _json({"error": "No account ID provided"})
    if not name:
        return _json({"error": "No rule name provided"})
    if not evaluation_spec:
        return _json({"error": "evaluation_spec is required"})
    if not execution_spec:
        return _json({"error": "execution_spec is required"})

    payload: Dict[str, Any] = {
        "name": name,
        "evaluation_spec": json.dumps(evaluation_spec),
        "execution_spec": json.dumps(execution_spec),
        "status": status,
    }

    if schedule_spec is not None:
        payload["schedule_spec"] = json.dumps(schedule_spec)

    result = await make_api_request(
        f"{ad_account_id}/adrules_library", meta_access_token, payload, method="POST"
    )
    return _json(result)


@mcp_server.tool()
@meta_api_tool
async def list_ad_rules(
    ad_account_id: str,
    meta_access_token: Optional[str] = None,
    page_size: int = 20,
) -> str:
    """List all automated rules for an ad account."""
    if not ad_account_id:
        return _json({"error": "No account ID provided"})

    payload = await make_api_request(
        f"{ad_account_id}/adrules_library",
        meta_access_token,
        {"fields": _RULE_FIELDS, "limit": page_size},
    )
    return _json(payload)


@mcp_server.tool()
@meta_api_tool
async def read_ad_rule(
    rule_id: str,
    meta_access_token: Optional[str] = None,
) -> str:
    """Fetch full details for one ad rule."""
    if not rule_id:
        return _json({"error": "No rule ID provided"})

    payload = await make_api_request(
        rule_id, meta_access_token, {"fields": _RULE_FIELDS}
    )
    return _json(payload)


@mcp_server.tool()
@meta_api_tool
async def update_ad_rule(
    rule_id: str,
    meta_access_token: Optional[str] = None,
    name: Optional[str] = None,
    status: Optional[str] = None,
    evaluation_spec: Optional[Dict[str, Any]] = None,
    execution_spec: Optional[Dict[str, Any]] = None,
    schedule_spec: Optional[Dict[str, Any]] = None,
) -> str:
    """Update an existing ad rule."""
    if not rule_id:
        return _json({"error": "No rule ID provided"})

    payload: Dict[str, Any] = {}
    if name is not None:
        payload["name"] = name
    if status is not None:
        payload["status"] = status
    if evaluation_spec is not None:
        payload["evaluation_spec"] = json.dumps(evaluation_spec)
    if execution_spec is not None:
        payload["execution_spec"] = json.dumps(execution_spec)
    if schedule_spec is not None:
        payload["schedule_spec"] = json.dumps(schedule_spec)

    if not payload:
        return _json({"error": "No update parameters provided"})

    result = await make_api_request(rule_id, meta_access_token, payload, method="POST")
    return _json(result)


@mcp_server.tool()
@meta_api_tool
async def delete_ad_rule(
    rule_id: str,
    meta_access_token: Optional[str] = None,
) -> str:
    """Permanently delete an ad rule."""
    if not rule_id:
        return _json({"error": "No rule ID provided"})

    result = await make_api_request(
        rule_id, meta_access_token, {}, method="DELETE"
    )
    return _json(result)


@mcp_server.tool()
@meta_api_tool
async def execute_ad_rule(
    rule_id: str,
    meta_access_token: Optional[str] = None,
) -> str:
    """Execute an ad rule immediately (does not wait for its schedule)."""
    if not rule_id:
        return _json({"error": "No rule ID provided"})

    result = await make_api_request(
        f"{rule_id}/execute", meta_access_token, {}, method="POST"
    )
    return _json(result)
```

- [ ] **Step 5.4: Run tests to verify they pass**

```bash
pytest tests/test_rule_tools.py -v
```

Expected: all 5 tests PASS.

- [ ] **Step 5.5: Register module in mcp_runtime.py**

Add `rule_tools` to `_import_tool_modules`.

- [ ] **Step 5.6: Commit**

```bash
git add src/armavita_meta_ads_mcp/core/rule_tools.py \
        src/armavita_meta_ads_mcp/core/mcp_runtime.py \
        tests/test_rule_tools.py
git commit -m "feat(mcp): add automated ad rules CRUD and execute tools"
```

---

## Task 6: Update Tool Surface Registry

The `tests/test_tool_surface.py` file maintains an exact snapshot of every registered tool name and its signature. It will fail after adding 18 new tools. Update both test functions.

**Files:**
- Modify: `tests/test_tool_surface.py`

- [ ] **Step 6.1: Run the existing surface test to see failures**

```bash
pytest tests/test_tool_surface.py -v
```

Expected: `AssertionError` — set mismatch in `test_v1_tool_names_are_exact`.

- [ ] **Step 6.2: Update `test_v1_tool_names_are_exact`**

Add these 18 tool names to the set:

```python
# audience_tools (6)
"list_custom_audiences",
"read_custom_audience",
"create_custom_audience",
"delete_custom_audience",
"add_users_to_audience",
"remove_users_from_audience",
# video_tools (3)
"upload_ad_video",
"list_ad_videos",
"read_ad_video",
# pixel_tools (2)
"list_pixels",
"read_pixel",
# delete_tools (3)
"delete_campaign",
"delete_ad_set",
"delete_ad",
# rule_tools (6)
"create_ad_rule",
"list_ad_rules",
"read_ad_rule",
"update_ad_rule",
"delete_ad_rule",
"execute_ad_rule",
```

- [ ] **Step 6.3: Update `test_v1_signature_snapshot`**

Add these entries to the signatures dict:

```python
"list_custom_audiences": ["ad_account_id", "meta_access_token", "page_size", "page_cursor"],
"read_custom_audience": ["audience_id", "meta_access_token"],
"create_custom_audience": ["ad_account_id", "name", "subtype", "meta_access_token", "description", "retention_days", "customer_file_source", "lookalike_spec", "rule", "pixel_id"],
"delete_custom_audience": ["audience_id", "meta_access_token"],
"add_users_to_audience": ["audience_id", "schema", "data", "meta_access_token", "is_raw"],
"remove_users_from_audience": ["audience_id", "schema", "data", "meta_access_token", "is_raw"],
"upload_ad_video": ["ad_account_id", "video_file_path", "title", "meta_access_token", "description"],
"list_ad_videos": ["ad_account_id", "meta_access_token", "page_size", "page_cursor"],
"read_ad_video": ["video_id", "meta_access_token"],
"list_pixels": ["ad_account_id", "meta_access_token"],
"read_pixel": ["pixel_id", "meta_access_token"],
"delete_campaign": ["campaign_id", "meta_access_token"],
"delete_ad_set": ["ad_set_id", "meta_access_token"],
"delete_ad": ["ad_id", "meta_access_token"],
"create_ad_rule": ["ad_account_id", "name", "evaluation_spec", "execution_spec", "meta_access_token", "schedule_spec", "status"],
"list_ad_rules": ["ad_account_id", "meta_access_token", "page_size"],
"read_ad_rule": ["rule_id", "meta_access_token"],
"update_ad_rule": ["rule_id", "meta_access_token", "name", "status", "evaluation_spec", "execution_spec", "schedule_spec"],
"delete_ad_rule": ["rule_id", "meta_access_token"],
"execute_ad_rule": ["rule_id", "meta_access_token"],
```

- [ ] **Step 6.4: Run the full test suite**

```bash
pytest --tb=short -q
```

Expected: all tests PASS (54 existing + ~26 new = ~80 total).

- [ ] **Step 6.5: Commit**

```bash
git add tests/test_tool_surface.py
git commit -m "test: update tool surface registry for 18 new MCP tools"
```

---

## Task 7: Final Smoke Test (Manual)

- [ ] **Step 7.1: Verify MCP starts cleanly**

```bash
cd technical/meta-ads/armavita-meta-ads-mcp
source .venv/bin/activate
python -m armavita_meta_ads_mcp --version
```

Expected: prints version with no errors.

- [ ] **Step 7.2: Live pixel test via MCP tool**

```
list_pixels(ad_account_id="act_1460297365542314")
```

Expected: `{"data": [...]}` — even empty list is success.

- [ ] **Step 7.3: Live audience list test**

```
list_custom_audiences(ad_account_id="act_1460297365542314")
```

Expected: `{"data": [...]}`.

- [ ] **Step 7.4: Tag the release**

```bash
git tag v1.2.0-extensions
```

---

## Summary of New Tools (18 total)

| Module | Tools |
|--------|-------|
| `audience_tools.py` | `list_custom_audiences`, `read_custom_audience`, `create_custom_audience`, `delete_custom_audience`, `add_users_to_audience`, `remove_users_from_audience` |
| `video_tools.py` | `upload_ad_video`, `list_ad_videos`, `read_ad_video` |
| `pixel_tools.py` | `list_pixels`, `read_pixel` |
| `delete_tools.py` | `delete_campaign`, `delete_ad_set`, `delete_ad` |
| `rule_tools.py` | `create_ad_rule`, `list_ad_rules`, `read_ad_rule`, `update_ad_rule`, `delete_ad_rule`, `execute_ad_rule` |
