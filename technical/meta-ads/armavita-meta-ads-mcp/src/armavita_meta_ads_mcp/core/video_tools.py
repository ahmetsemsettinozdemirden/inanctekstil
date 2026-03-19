# Copyright (C) 2025 ArmaVita LLC
# SPDX-License-Identifier: AGPL-3.0-only

"""Ad video upload and management tools."""

import json
from pathlib import Path
from typing import Any, Dict, Optional

import httpx

from .graph_client import USER_AGENT, make_api_request, meta_api_tool
from .graph_constants import META_GRAPH_API_BASE
from .mcp_runtime import mcp_server

_VIDEO_FIELDS = "id,title,description,status,created_time,length,thumbnails"


def _json(payload: Dict[str, Any]) -> str:
    return json.dumps(payload, indent=2)


@mcp_server.tool()
@meta_api_tool
async def upload_ad_video(
    ad_account_id: str,
    video_file_path: str,
    title: str,
    meta_access_token: Optional[str] = None,
    description: Optional[str] = None,
) -> str:
    """Upload a local video file as an ad video asset.

    Returns video_id for use in create_ad_creative (ad_video_id field).
    video_file_path: absolute path to a local .mp4 file.
    """
    if not ad_account_id:
        return _json({"error": "No account ID provided"})
    if not title:
        return _json({"error": "No video title provided"})
    if not video_file_path:
        return _json({"error": "No video_file_path provided"})

    path = Path(video_file_path)
    if not path.exists():
        return _json({
            "error": f"File not found: {video_file_path}",
            "video_file_path": video_file_path,
        })

    url = f"{META_GRAPH_API_BASE}/{ad_account_id}/advideos"

    data_fields = {"access_token": meta_access_token, "title": title}
    if description:
        data_fields["description"] = description

    try:
        with open(path, "rb") as f:
            video_bytes = f.read()

        files = {"source": (path.name, video_bytes, "video/mp4")}

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                url,
                data=data_fields,
                files=files,
                headers={"User-Agent": USER_AGENT},
            )
            response.raise_for_status()
            raw = response.json()

    except FileNotFoundError:
        return _json({"error": f"File not found: {video_file_path}", "video_file_path": video_file_path})
    except httpx.HTTPStatusError as exc:
        try:
            error_payload = exc.response.json()
        except Exception:  # noqa: BLE001
            error_payload = {"status_code": exc.response.status_code, "text": exc.response.text}
        return _json({"error": "Failed to upload video", "details": error_payload})
    except Exception as exc:  # noqa: BLE001
        return _json({"error": f"Upload failed: {exc}"})

    video_id = str(raw.get("id") or raw.get("video_id") or "")
    return _json({
        "success": raw.get("success", True),
        "video_id": video_id,
        "ad_account_id": ad_account_id,
        "title": title,
        "raw": raw,
    })


@mcp_server.tool()
@meta_api_tool
async def list_ad_videos(
    ad_account_id: str,
    meta_access_token: Optional[str] = None,
    page_size: int = 10,
    page_cursor: str = "",
) -> str:
    """List ad video assets for an ad account."""
    if not ad_account_id:
        return _json({"error": "No account ID provided"})

    params: Dict[str, Any] = {"fields": _VIDEO_FIELDS, "limit": page_size}
    if page_cursor:
        params["after"] = page_cursor

    payload = await make_api_request(
        f"{ad_account_id}/advideos", meta_access_token, params
    )
    return _json(payload)


@mcp_server.tool()
@meta_api_tool
async def read_ad_video(
    video_id: str,
    meta_access_token: Optional[str] = None,
) -> str:
    """Fetch details for one ad video by ID."""
    if not video_id:
        return _json({"error": "No video ID provided"})

    payload = await make_api_request(
        video_id,
        meta_access_token,
        {"fields": _VIDEO_FIELDS + ",embed_html,format,live_status"},
    )
    return _json(payload)
