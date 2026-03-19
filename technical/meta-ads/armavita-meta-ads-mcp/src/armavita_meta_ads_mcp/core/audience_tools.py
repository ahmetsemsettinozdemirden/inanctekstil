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

    # Meta Graph API v25 does not accept `subtype` for rule-based audience types.
    # WEBSITE/ENGAGEMENT audiences are identified by their rule/pixel_id params.
    # LOOKALIKE is identified by lookalike_spec. Only CUSTOM still requires subtype.
    _SUBTYPE_OMIT = {"WEBSITE", "ENGAGEMENT", "LOOKALIKE", "APP"}
    payload: Dict[str, Any] = {"name": name}
    if subtype.upper() not in _SUBTYPE_OMIT:
        payload["subtype"] = subtype.upper()

    if description:
        payload["description"] = description
    if customer_file_source:
        payload["customer_file_source"] = customer_file_source
    if lookalike_spec is not None:
        payload["lookalike_spec"] = json.dumps(lookalike_spec)
    if pixel_id:
        payload["pixel_id"] = pixel_id

    # For WEBSITE audiences: build a default PageView rule from pixel_id + retention_days
    # if no explicit rule was provided. Without a rule, v25 can't identify the audience type.
    if subtype.upper() == "WEBSITE" and rule is None and pixel_id and retention_days is not None:
        rule = {
            "inclusions": {
                "operator": "or",
                "rules": [
                    {
                        "event_sources": [{"id": pixel_id, "type": "pixel"}],
                        "retention_seconds": retention_days * 86400,
                        "filter": {
                            "operator": "and",
                            "filters": [{"field": "event", "operator": "eq", "value": "PageView"}],
                        },
                    }
                ],
            }
        }
    if retention_days is not None and subtype.upper() != "WEBSITE":
        payload["retention_days"] = str(retention_days)
    if rule is not None:
        payload["rule"] = json.dumps(rule)

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
