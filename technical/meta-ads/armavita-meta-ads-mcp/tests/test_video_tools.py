# Copyright (C) 2025 ArmaVita LLC
# SPDX-License-Identifier: AGPL-3.0-only

import json
import sys
import tempfile
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from armavita_meta_ads_mcp.core.video_tools import (
    list_ad_videos,
    read_ad_video,
    upload_ad_video,
)

LIST_PATCH = "armavita_meta_ads_mcp.core.video_tools.make_api_request"


@pytest.mark.asyncio
async def test_upload_ad_video_reads_file_bytes():
    """Video upload must send actual file bytes via multipart, not a path string."""
    fake_bytes = b"\x00\x00\x00\x18ftypmp42"  # fake MP4 header

    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
        f.write(fake_bytes)
        tmp_path = f.name

    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json = MagicMock(return_value={"id": "99", "success": True})

    with patch("armavita_meta_ads_mcp.core.video_tools.httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=False)
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client_cls.return_value = mock_client

        result = await upload_ad_video(
            ad_account_id="act_123",
            video_file_path=tmp_path,
            title="Test Video",
            meta_access_token="tok",
        )

    payload = json.loads(result)
    assert payload.get("success") is True
    assert payload.get("video_id") == "99"

    call_kwargs = mock_client.post.call_args.kwargs
    assert "files" in call_kwargs, "Video upload must use multipart files, not form data"


@pytest.mark.asyncio
async def test_upload_ad_video_missing_file_returns_error():
    result = await upload_ad_video(
        ad_account_id="act_123",
        video_file_path="/nonexistent/video.mp4",
        title="Test",
        meta_access_token="tok",
    )
    outer = json.loads(result)
    payload = json.loads(outer["data"]) if "data" in outer else outer
    assert "error" in payload


@pytest.mark.asyncio
async def test_list_ad_videos_passes_correct_endpoint():
    with patch(LIST_PATCH, new_callable=AsyncMock) as mock_api:
        mock_api.return_value = {"data": []}
        result = await list_ad_videos(
            ad_account_id="act_123", meta_access_token="tok"
        )
    assert json.loads(result) == {"data": []}
    assert mock_api.call_args.args[0] == "act_123/advideos"


@pytest.mark.asyncio
async def test_read_ad_video_requires_id():
    result = await read_ad_video(video_id="", meta_access_token="tok")
    outer = json.loads(result)
    payload = json.loads(outer["data"]) if "data" in outer else outer
    assert "error" in payload
