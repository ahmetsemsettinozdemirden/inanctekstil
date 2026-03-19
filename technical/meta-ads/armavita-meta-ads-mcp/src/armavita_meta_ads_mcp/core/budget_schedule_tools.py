# Copyright (C) 2025 ArmaVita LLC
# SPDX-License-Identifier: AGPL-3.0-only

"""Campaign budget schedule tooling."""


import json
from typing import Optional

from .graph_client import make_api_request, meta_api_tool
from .mcp_runtime import mcp_server

_ALLOWED_BUDGET_VALUE_TYPES = {"ABSOLUTE", "MULTIPLIER"}


@mcp_server.tool()
@meta_api_tool
async def create_campaign_budget_schedule(
    campaign_id: str,
    budget_value: int,
    budget_value_type: str,
    time_start: int,
    time_end: int,
    meta_access_token: Optional[str] = None,
) -> str:
    """Create a high-demand budget schedule for a campaign."""
    if not campaign_id:
        return json.dumps({"error": "Campaign ID is required"}, indent=2)
    if budget_value is None:
        return json.dumps({"error": "Budget value is required"}, indent=2)
    if time_start is None or time_end is None:
        return json.dumps({"error": "time_start and time_end are required"}, indent=2)

    normalized_type = str(budget_value_type or "").upper().strip()
    if normalized_type not in _ALLOWED_BUDGET_VALUE_TYPES:
        return json.dumps(
            {
                "error": "Invalid budget_value_type",
                "details": "budget_value_type must be ABSOLUTE or MULTIPLIER",
            },
            indent=2,
        )

    payload = {
        "budget_value": budget_value,
        "budget_value_type": normalized_type,
        "time_start": time_start,
        "time_end": time_end,
    }

    result = await make_api_request(f"{campaign_id}/budget_schedules", meta_access_token, payload, method="POST")

    if isinstance(result, dict) and "error" in result:
        err = result["error"]
        details = err.get("details", {})
        inner = details.get("error", {}) if isinstance(details, dict) else {}
        msg = (inner.get("message") or "").lower() if isinstance(inner, dict) else ""
        if "daily budget" in msg or "cbo" in msg or "campaign budget" in msg:
            return json.dumps({
                "error": "campaign_budget_schedule_requires_cbo",
                "message": (
                    "Budget schedules require a Campaign Budget Optimization (CBO) campaign "
                    "with a campaign-level daily_budget. Ad-set-level budget campaigns do not support schedules."
                ),
                "how_to_fix": [
                    "Create the campaign with daily_budget set at the campaign level (not ad-set level).",
                    "Do NOT pass use_ad_set_level_budgets=true when creating the campaign.",
                    "Then create budget_schedules on the campaign_id.",
                ],
                "meta_error": inner,
            }, indent=2)

    return json.dumps(result, indent=2)