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
