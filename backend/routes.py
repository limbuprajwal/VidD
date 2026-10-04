"""API routes for video info extraction and download."""

import asyncio
import re
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException, Query, Request
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, field_validator

from services import download_media, extract_info
from utils import cleanup_file, detect_platform, is_supported_url

router = APIRouter(prefix="/api")


# ── Request / Response Models ────────────────────────────────────────

class InfoRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("URL must not be empty.")
        if not is_supported_url(v):
            raise ValueError(
                "Unsupported URL. Please provide a valid YouTube, Facebook, Instagram, TikTok, or Twitter/X link."
            )
        return v


# ── POST /api/info ───────────────────────────────────────────────────

@router.post("/info")
async def get_video_info(body: InfoRequest):
    """Extract and return video metadata without downloading."""
    platform = detect_platform(body.url)
    try:
        info = await extract_info(body.url)
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail="Metadata extraction timed out. The video may be unavailable or the server is under heavy load.",
        )
    except Exception as exc:
        msg = str(exc).lower()
        if "private" in msg or "login" in msg or "restricted" in msg:
            raise HTTPException(
                status_code=403,
                detail="This video is private, restricted, or requires login.",
            )
        if "not found" in msg or "unavailable" in msg or "deleted" in msg:
            raise HTTPException(
                status_code=404,
                detail="This video has been removed or is unavailable.",
            )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract video info: {exc}",
        )

    info["platform"] = platform
    return info


# ── GET /api/download ───────────────────────────────────────────────

@router.get("/download")
async def download_video(
    background_tasks: BackgroundTasks,
    url: str = Query(..., description="Video URL"),
    quality_id: str | None = Query(None, description="yt-dlp format id"),
    format: str = Query("mp4", description="mp4 or mp3"),
):
    """Download the requested media and stream it to the client."""
    if not is_supported_url(url):
        raise HTTPException(status_code=400, detail="Unsupported URL.")

    if format not in ("mp4", "mp3"):
        raise HTTPException(status_code=400, detail="Format must be 'mp4' or 'mp3'.")

    try:
        filepath = await download_media(url, quality_id, format)
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Download timed out.")
    except Exception as exc:
        msg = str(exc).lower()
        if "private" in msg or "login" in msg or "restricted" in msg:
            raise HTTPException(
                status_code=403,
                detail="This video is private, restricted, or requires login.",
            )
        raise HTTPException(
            status_code=500,
            detail=f"Download failed: {exc}",
        )

    # Determine a sane filename for the browser
    safe_name = filepath.stem[:60]
    ext = "mp3" if format == "mp3" else "mp4"
    media_type = "audio/mpeg" if format == "mp3" else "video/mp4"

    # Schedule cleanup after the response is sent
    background_tasks.add_task(cleanup_file, str(filepath))

    return FileResponse(
        path=str(filepath),
        filename=f"{safe_name}.{ext}",
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{safe_name}.{ext}"'},
    )
