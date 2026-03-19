# Copyright (C) 2025 ArmaVita LLC
# SPDX-License-Identifier: AGPL-3.0-only

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
    assert mock_api.call_args.kwargs.get("method") == "DELETE"
    assert mock_api.call_args.args[0] == "123"


@pytest.mark.asyncio
async def test_delete_campaign_requires_id():
    result = await delete_campaign(campaign_id="", meta_access_token="tok")
    outer = json.loads(result)
    payload = json.loads(outer["data"]) if "data" in outer else outer
    assert "error" in payload


@pytest.mark.asyncio
async def test_delete_ad_set_calls_delete_method():
    with patch(PATCH, new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"success": True}
        await delete_ad_set(ad_set_id="456", meta_access_token="tok")
    assert mock_api.call_args.kwargs.get("method") == "DELETE"


@pytest.mark.asyncio
async def test_delete_ad_requires_id():
    result = await delete_ad(ad_id="", meta_access_token="tok")
    outer = json.loads(result)
    payload = json.loads(outer["data"]) if "data" in outer else outer
    assert "error" in payload


@pytest.mark.asyncio
async def test_delete_ad_calls_delete_method():
    with patch(PATCH, new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"success": True}
        await delete_ad(ad_id="789", meta_access_token="tok")
    assert mock_api.call_args.kwargs.get("method") == "DELETE"
    assert mock_api.call_args.args[0] == "789"
