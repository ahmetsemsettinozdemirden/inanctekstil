# Copyright (C) 2025 ArmaVita LLC
# SPDX-License-Identifier: AGPL-3.0-only

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from armavita_meta_ads_mcp.core.mcp_runtime import _import_tool_modules, mcp_server


EXPECTED_V1_TOOLS = {
    "list_ad_accounts",
    "read_ad_account",
    "list_campaigns",
    "read_campaign",
    "create_campaign",
    "update_campaign",
    "list_ad_sets",
    "read_ad_set",
    "create_ad_set",
    "update_ad_set",
    "list_ads",
    "read_ad",
    "list_ad_previews",
    "create_ad",
    "update_ad",
    "list_ad_creatives",
    "read_ad_creative",
    "create_ad_creative",
    "update_ad_creative",
    "upload_ad_image_asset",
    "read_ad_image",
    "export_ad_image_file",
    "get_instagram_actor_id",
    "search_pages",
    "list_account_pages",
    "list_insights",
    "create_report",
    "create_campaign_budget_schedule",
    "search_interests",
    "suggest_interests",
    "estimate_audience_size",
    "search_behaviors",
    "search_demographics",
    "search_geo_locations",
    "clone_campaign",
    "clone_ad_set",
    "clone_ad",
    "clone_ad_creative",
    "search_ads_archive",
    "search_web_content",
    "read_web_content",
    # audience_tools
    "list_custom_audiences",
    "read_custom_audience",
    "create_custom_audience",
    "delete_custom_audience",
    "add_users_to_audience",
    "remove_users_from_audience",
    # video_tools
    "upload_ad_video",
    "list_ad_videos",
    "read_ad_video",
    # pixel_tools
    "list_pixels",
    "read_pixel",
    # delete_tools
    "delete_campaign",
    "delete_ad_set",
    "delete_ad",
    # rule_tools
    "create_ad_rule",
    "list_ad_rules",
    "read_ad_rule",
    "update_ad_rule",
    "delete_ad_rule",
    "execute_ad_rule",
}


def _runtime_tool_names() -> set[str]:
    _import_tool_modules()
    return set(mcp_server._tool_manager._tools.keys())


def test_runtime_tool_surface_is_exact_v1_contract():
    assert _runtime_tool_names() == EXPECTED_V1_TOOLS


def test_runtime_includes_export_image_tool():
    assert "export_ad_image_file" in _runtime_tool_names()