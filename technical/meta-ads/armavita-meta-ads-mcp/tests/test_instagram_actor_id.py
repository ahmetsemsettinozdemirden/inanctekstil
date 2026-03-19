# Copyright (C) 2025 ArmaVita LLC
# SPDX-License-Identifier: AGPL-3.0-only

import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from armavita_meta_ads_mcp.core.ad_tools import get_instagram_actor_id


@pytest.mark.asyncio
async def test_get_instagram_actor_id_returns_first_linked_account():
    with patch("armavita_meta_ads_mcp.core.ad_tools.make_api_request", new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {
            "id": "1064624423394553",
            "instagram_accounts": {
                "data": [
                    {"id": "17841400000000001", "username": "inanc_tekstil"}
                ]
            },
        }

        result = await get_instagram_actor_id(
            facebook_page_id="1064624423394553",
            meta_access_token="token",
        )

    payload = json.loads(result)
    assert payload["instagram_actor_id"] == "17841400000000001"
    assert payload["username"] == "inanc_tekstil"
    assert payload["facebook_page_id"] == "1064624423394553"

    call_args = mock_api.call_args
    assert call_args.args[0] == "1064624423394553"
    assert "instagram_accounts" in call_args.args[2]["fields"]


@pytest.mark.asyncio
async def test_get_instagram_actor_id_returns_error_when_no_linked_account():
    with patch("armavita_meta_ads_mcp.core.ad_tools.make_api_request", new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {
            "id": "1064624423394553",
            "instagram_accounts": {"data": []},
        }

        result = await get_instagram_actor_id(
            facebook_page_id="1064624423394553",
            meta_access_token="token",
        )

    outer = json.loads(result)
    payload = json.loads(outer["data"]) if "data" in outer else outer
    assert "error" in payload
    assert "no instagram account" in payload["error"].lower()


@pytest.mark.asyncio
async def test_get_instagram_actor_id_requires_page_id():
    result = await get_instagram_actor_id(
        facebook_page_id="",
        meta_access_token="token",
    )
    outer = json.loads(result)
    payload = json.loads(outer["data"]) if "data" in outer else outer
    assert "error" in payload
