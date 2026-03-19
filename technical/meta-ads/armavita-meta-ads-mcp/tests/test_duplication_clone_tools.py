# Copyright (C) 2025 ArmaVita LLC
# SPDX-License-Identifier: AGPL-3.0-only

import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from armavita_meta_ads_mcp.core.duplication_tools import (
    _build_creative_clone_payload,
    clone_ad,
    clone_ad_creative,
    clone_campaign,
)


@pytest.mark.asyncio
async def test_clone_campaign_warning_list_has_no_token_option_names():
    with patch("armavita_meta_ads_mcp.core.duplication_tools.make_api_request", new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"copied_campaign_id": "cmp_copy_1"}

        raw = await clone_campaign(
            campaign_id="cmp_1",
            meta_access_token="token",
            include_ad_sets=True,
            include_ads=True,
            include_creatives=True,
        )

    payload = json.loads(raw)
    assert payload["success"] is True
    warning_options = [str(item.get("option", "")) for item in payload.get("warnings", [])]
    assert all("token" not in option.lower() for option in warning_options)


@pytest.mark.asyncio
async def test_clone_ad_maps_target_ad_set_id_to_graph_param():
    with patch("armavita_meta_ads_mcp.core.duplication_tools.make_api_request", new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"copied_ad_id": "ad_copy_1"}

        raw = await clone_ad(
            ad_id="ad_1",
            meta_access_token="token",
            target_ad_set_id="adset_target_1",
            clone_ad_creative=False,
        )

    payload = json.loads(raw)
    assert payload["success"] is True

    params = mock_api.call_args.args[2]
    assert params["adset_id"] == "adset_target_1"
    assert params["deep_copy"] is False


# ---------------------------------------------------------------------------
# clone_ad_creative — _build_creative_clone_payload unit tests
# ---------------------------------------------------------------------------

def test_build_creative_clone_payload_story_spec_applies_overrides():
    source = {
        "name": "Original Creative",
        "object_story_spec": {
            "page_id": "111",
            "link_data": {
                "message": "Old text",
                "name": "Old headline",
                "link": "https://old.example.com",
                "call_to_action": {"type": "LEARN_MORE"},
            },
        },
    }
    payload = _build_creative_clone_payload(
        source,
        " - Copy",
        {
            "new_primary_text": "New text",
            "new_headline": "New headline",
            "new_destination_url": "https://new.example.com",
            "new_cta_type": "SHOP_NOW",
            "new_description": None,
        },
    )
    assert payload["name"] == "Original Creative - Copy"
    spec = json.loads(payload["object_story_spec"])
    assert spec["link_data"]["message"] == "New text"
    assert spec["link_data"]["name"] == "New headline"
    assert spec["link_data"]["link"] == "https://new.example.com"
    assert spec["link_data"]["call_to_action"]["type"] == "SHOP_NOW"


def test_build_creative_clone_payload_asset_feed_sends_feed_and_page_id():
    source = {
        "name": "Feed Creative",
        "object_story_spec": {"page_id": "222"},
        "asset_feed_spec": {
            "images": [{"hash": "abc"}],
            "bodies": [{"text": "Buy now"}],
        },
    }
    payload = _build_creative_clone_payload(source, " - Copy", {})
    assert payload["name"] == "Feed Creative - Copy"
    assert "asset_feed_spec" in payload
    feed = json.loads(payload["asset_feed_spec"])
    assert feed["images"] == [{"hash": "abc"}]
    spec = json.loads(payload["object_story_spec"])
    assert spec == {"page_id": "222"}


def test_build_creative_clone_payload_asset_feed_without_story_spec_still_sends_feed():
    source = {
        "name": "Feed Only",
        "asset_feed_spec": {"images": [{"hash": "xyz"}]},
    }
    payload = _build_creative_clone_payload(source, "", {})
    assert "asset_feed_spec" in payload
    assert "object_story_spec" not in payload  # no page_id available


def test_build_creative_clone_payload_no_spec_returns_empty():
    payload = _build_creative_clone_payload({"name": "Ghost"}, "", {})
    # Empty dict — caller checks `not payload` to detect unsupported format
    assert payload == {}


# ---------------------------------------------------------------------------
# clone_ad_creative — integration: act_ prefix added to account_id
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_clone_ad_creative_adds_act_prefix_to_account_id():
    """Graph API returns account_id without act_ — we must add it before posting."""
    source_creative = {
        "id": "creative_src",
        "name": "Source",
        "account_id": "9999888",  # no act_ prefix
        "object_story_spec": {
            "page_id": "111",
            "link_data": {"message": "Hello", "link": "https://example.com"},
        },
    }
    new_creative = {"id": "creative_clone_1"}

    with patch(
        "armavita_meta_ads_mcp.core.duplication_tools.make_api_request",
        new_callable=AsyncMock,
    ) as mock_api:
        mock_api.side_effect = [source_creative, new_creative]
        raw = await clone_ad_creative(
            ad_creative_id="creative_src",
            meta_access_token="token",
        )

    result = json.loads(raw)
    assert result["success"] is True
    assert result["new_id"] == "creative_clone_1"

    post_call = mock_api.call_args_list[1]
    endpoint = post_call.args[0]
    assert endpoint == "act_9999888/adcreatives"


@pytest.mark.asyncio
async def test_clone_ad_creative_asset_feed_posts_correct_payload():
    """asset_feed_spec creatives must send both asset_feed_spec and page_id object_story_spec."""
    source_creative = {
        "id": "creative_feed_src",
        "name": "Feed Ad",
        "account_id": "act_1111",
        "object_story_spec": {"page_id": "333"},
        "asset_feed_spec": {
            "images": [{"hash": "h1"}, {"hash": "h2"}],
            "bodies": [{"text": "Copy A"}, {"text": "Copy B"}],
        },
    }
    new_creative = {"id": "creative_feed_clone"}

    with patch(
        "armavita_meta_ads_mcp.core.duplication_tools.make_api_request",
        new_callable=AsyncMock,
    ) as mock_api:
        mock_api.side_effect = [source_creative, new_creative]
        raw = await clone_ad_creative(
            ad_creative_id="creative_feed_src",
            meta_access_token="token",
        )

    result = json.loads(raw)
    assert result["success"] is True

    post_call = mock_api.call_args_list[1]
    params = post_call.args[2]
    assert "asset_feed_spec" in params
    assert "object_story_spec" in params
    spec = json.loads(params["object_story_spec"])
    assert spec == {"page_id": "333"}