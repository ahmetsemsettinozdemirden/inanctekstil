# Copyright (C) 2025 ArmaVita LLC
# SPDX-License-Identifier: AGPL-3.0-only

import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from armavita_meta_ads_mcp.core.audience_tools import (
    add_users_to_audience,
    create_custom_audience,
    delete_custom_audience,
    list_custom_audiences,
    read_custom_audience,
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
    result = await list_custom_audiences(ad_account_id="", meta_access_token="tok")
    outer = json.loads(result)
    payload = json.loads(outer["data"]) if "data" in outer else outer
    assert "error" in payload


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
    outer = json.loads(result)
    payload = json.loads(outer["data"]) if "data" in outer else outer
    assert "error" in payload


@pytest.mark.asyncio
async def test_create_lookalike_sends_lookalike_spec():
    with patch(PATCH, new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"id": "456"}
        await create_custom_audience(
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
    assert mock_api.call_args.kwargs.get("method") == "DELETE"


@pytest.mark.asyncio
async def test_add_users_to_audience_sends_schema_and_data():
    with patch(PATCH, new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"num_received": 2, "num_invalid_entries": 0}
        await add_users_to_audience(
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
    assert mock_api.call_args.kwargs.get("method") == "DELETE"
