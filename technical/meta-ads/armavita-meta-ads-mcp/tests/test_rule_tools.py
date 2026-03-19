# Copyright (C) 2025 ArmaVita LLC
# SPDX-License-Identifier: AGPL-3.0-only

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
    outer = json.loads(result)
    payload = json.loads(outer["data"]) if "data" in outer else outer
    assert "error" in payload


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
    assert mock_api.call_args.kwargs.get("method") == "DELETE"


@pytest.mark.asyncio
async def test_execute_ad_rule_posts_to_execute_edge():
    with patch(PATCH, new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"success": True}
        await execute_ad_rule(rule_id="rule_1", meta_access_token="tok")
    assert mock_api.call_args.args[0] == "rule_1/execute"
    assert mock_api.call_args.kwargs.get("method") == "POST"
