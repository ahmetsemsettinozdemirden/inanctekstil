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

    if isinstance(result, dict) and "error" in result:
        err = result["error"]
        details = err.get("details", {})
        inner = details.get("error", {}) if isinstance(details, dict) else {}
        status_code = err.get("full_response", {}).get("status_code") if isinstance(err.get("full_response"), dict) else None
        if status_code == 500 or (isinstance(inner, dict) and inner.get("code") == 1):
            return _json({
                "error": "ad_rules_not_available",
                "message": (
                    "Automated ad rules are not available for this account. "
                    "This is typically an eligibility gate — the account must have "
                    "spending history before ad rules can be created."
                ),
                "suggestions": [
                    "Run a small campaign (even $1-5 spend) to establish account history.",
                    "Retry creating the rule after the account has some delivery.",
                    "Check if the account is fully verified and payment method confirmed.",
                ],
                "meta_error": inner,
            })

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
