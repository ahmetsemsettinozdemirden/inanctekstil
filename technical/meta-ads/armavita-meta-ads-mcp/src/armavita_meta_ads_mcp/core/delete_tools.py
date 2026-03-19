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
