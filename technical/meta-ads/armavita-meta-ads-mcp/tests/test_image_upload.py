# Copyright (C) 2025 ArmaVita LLC
# SPDX-License-Identifier: AGPL-3.0-only

import base64
import json
import sys
import tempfile
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from armavita_meta_ads_mcp.core.ad_tools import upload_ad_image_asset


@pytest.mark.asyncio
async def test_upload_reads_local_file_bytes_not_path_string():
    """Regression test for BUG-1: local path must be read from disk, not sent as-is."""
    image_bytes = b"\x89PNG\r\n\x1a\n" + b"\x00" * 100  # fake PNG header

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as f:
        f.write(image_bytes)
        tmp_path = f.name

    with patch("armavita_meta_ads_mcp.core.ad_tools.make_api_request", new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"images": {"abc123": {"hash": "abc123", "url": "https://example.com/img.png"}}}

        result = await upload_ad_image_asset(
            ad_account_id="act_123",
            image_file_path=tmp_path,
            meta_access_token="token",
        )

    payload = json.loads(result)
    assert payload.get("success") is True

    sent_bytes_b64 = mock_api.call_args.args[2]["bytes"]
    decoded = base64.b64decode(sent_bytes_b64)
    assert decoded == image_bytes, "Must send actual file bytes, not the path string"


@pytest.mark.asyncio
async def test_upload_infers_filename_from_local_path():
    image_bytes = b"\xff\xd8\xff"  # fake JPEG header

    with tempfile.NamedTemporaryFile(suffix=".jpg", prefix="my_photo_", delete=False) as f:
        f.write(image_bytes)
        tmp_path = f.name

    with patch("armavita_meta_ads_mcp.core.ad_tools.make_api_request", new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"images": {"h1": {"hash": "h1"}}}

        await upload_ad_image_asset(
            ad_account_id="act_123",
            image_file_path=tmp_path,
            meta_access_token="token",
        )

    sent_name = mock_api.call_args.args[2]["name"]
    assert sent_name.endswith(".jpg")
    assert "my_photo_" in sent_name


@pytest.mark.asyncio
async def test_upload_returns_error_for_missing_file():
    with patch("armavita_meta_ads_mcp.core.ad_tools.make_api_request", new_callable=AsyncMock):
        result = await upload_ad_image_asset(
            ad_account_id="act_123",
            image_file_path="/nonexistent/path/image.png",
            meta_access_token="token",
        )

    # meta_api_tool wraps string-error payloads in {"data": "..."} — unwrap if needed
    outer = json.loads(result)
    payload = json.loads(outer["data"]) if "data" in outer else outer
    assert "error" in payload
    assert "image_file_path" in payload
