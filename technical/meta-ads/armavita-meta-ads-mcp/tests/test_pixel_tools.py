# Copyright (C) 2025 ArmaVita LLC
# SPDX-License-Identifier: AGPL-3.0-only

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
    outer = json.loads(result)
    payload = json.loads(outer["data"]) if "data" in outer else outer
    assert "error" in payload


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
    outer = json.loads(result)
    payload = json.loads(outer["data"]) if "data" in outer else outer
    assert "error" in payload
