# Copyright (C) 2025 ArmaVita LLC
# SPDX-License-Identifier: AGPL-3.0-only

import json
import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from armavita_meta_ads_mcp.core.ad_tools import create_ad_creative


@pytest.mark.asyncio
async def test_create_ad_creative_simple_image_payload_uses_story_spec_fields():
    with patch("armavita_meta_ads_mcp.core.ad_tools.make_api_request", new_callable=AsyncMock) as mock_api:
        mock_api.side_effect = [{"id": "creative_1"}, {"id": "creative_1", "name": "Creative"}]

        raw = await create_ad_creative(
            ad_account_id="act_123",
            ad_image_hash="hash_1",
            facebook_page_id="123456",
            link_url="https://example.com",
            primary_text="Primary copy",
            headline_text="Headline",
            description_text="Description text",
            call_to_action_type="LEARN_MORE",
            lead_form_id="lead_form_1",
            meta_access_token="token",
        )

    payload = json.loads(raw)
    assert payload["success"] is True

    params = mock_api.call_args_list[0].args[2]
    story = params["object_story_spec"]
    assert story["page_id"] == "123456"
    assert story["link_data"]["message"] == "Primary copy"
    assert story["link_data"]["description"] == "Description text"
    assert story["link_data"]["call_to_action"]["value"]["lead_gen_form_id"] == "lead_form_1"


@pytest.mark.asyncio
async def test_create_ad_creative_variant_payload_uses_asset_feed_spec():
    with patch("armavita_meta_ads_mcp.core.ad_tools.make_api_request", new_callable=AsyncMock) as mock_api:
        mock_api.side_effect = [{"id": "creative_2"}, {"id": "creative_2", "name": "Creative"}]

        raw = await create_ad_creative(
            ad_account_id="act_123",
            facebook_page_id="123456",
            link_url="https://example.com",
            ad_image_hashes=["hash_a", "hash_b"],
            primary_text_variants=["Copy A", "Copy B"],
            headline_variants=["Headline A"],
            description_variants=["Desc A"],
            meta_access_token="token",
        )

    payload = json.loads(raw)
    assert payload["success"] is True

    params = mock_api.call_args_list[0].args[2]
    feed = params["asset_feed_spec"]
    assert feed["images"] == [{"hash": "hash_a"}, {"hash": "hash_b"}]
    assert feed["bodies"] == [{"text": "Copy A"}, {"text": "Copy B"}]
    assert feed["titles"] == [{"text": "Headline A"}]
    assert feed["descriptions"] == [{"text": "Desc A"}]


@pytest.mark.asyncio
async def test_create_ad_creative_carousel_builds_child_attachments():
    with patch("armavita_meta_ads_mcp.core.ad_tools.make_api_request", new_callable=AsyncMock) as mock_api:
        mock_api.side_effect = [{"id": "creative_3"}, {"id": "creative_3", "name": "Carousel"}]

        raw = await create_ad_creative(
            ad_account_id="act_123",
            facebook_page_id="123456",
            link_url="https://example.com",
            primary_text="Shop our collection",
            carousel_cards=[
                {
                    "image_hash": "hash_card_1",
                    "link": "https://example.com/product-1",
                    "name": "Product 1",
                    "description": "Best seller",
                    "call_to_action": {"type": "SHOP_NOW"},
                },
                {
                    "image_hash": "hash_card_2",
                    "link": "https://example.com/product-2",
                    "name": "Product 2",
                },
            ],
            meta_access_token="token",
        )

    payload = json.loads(raw)
    assert payload["success"] is True

    params = mock_api.call_args_list[0].args[2]
    story = params["object_story_spec"]
    assert story["page_id"] == "123456"
    link_data = story["link_data"]
    assert link_data["link"] == "https://example.com"
    assert link_data["message"] == "Shop our collection"

    children = link_data["child_attachments"]
    assert len(children) == 2
    assert children[0]["image_hash"] == "hash_card_1"
    assert children[0]["link"] == "https://example.com/product-1"
    assert children[0]["name"] == "Product 1"
    assert children[0]["description"] == "Best seller"
    assert children[0]["call_to_action"] == {"type": "SHOP_NOW"}
    assert children[1]["image_hash"] == "hash_card_2"
    assert "description" not in children[1]


@pytest.mark.asyncio
async def test_create_ad_creative_carousel_requires_at_least_two_cards():
    raw = await create_ad_creative(
        ad_account_id="act_123",
        facebook_page_id="123456",
        link_url="https://example.com",
        carousel_cards=[{"image_hash": "hash_1", "link": "https://example.com/p1"}],
        meta_access_token="token",
    )
    outer = json.loads(raw)
    payload = json.loads(outer["data"]) if "data" in outer else outer
    assert "error" in payload
    assert "2" in payload["error"]


@pytest.mark.asyncio
async def test_create_ad_creative_carousel_rejects_mixed_media():
    """carousel_cards and ad_image_hash are mutually exclusive."""
    raw = await create_ad_creative(
        ad_account_id="act_123",
        facebook_page_id="123456",
        link_url="https://example.com",
        ad_image_hash="standalone_hash",
        carousel_cards=[
            {"image_hash": "c1", "link": "https://example.com/1"},
            {"image_hash": "c2", "link": "https://example.com/2"},
        ],
        meta_access_token="token",
    )
    outer = json.loads(raw)
    payload = json.loads(outer["data"]) if "data" in outer else outer
    assert "error" in payload