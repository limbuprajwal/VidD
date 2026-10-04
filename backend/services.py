"""yt-dlp wrapper functions for metadata extraction and download streaming."""

import asyncio
import os
import uuid
from pathlib import Path
from typing import Any

import yt_dlp

from utils import TEMP_DIR

# ── Optional cookies file for Instagram / Facebook / TikTok ──────────
# Place a Netscape-format cookies.txt in the backend/ directory
# to authenticate with platforms that require login.
COOKIES_FILE = Path(__file__).parent / "cookies.txt"


def _base_opts(timeout: float = 15.0) -> dict:
    """Shared yt-dlp options for all requests."""
    opts: dict[str, Any] = {
        "quiet": True,
        "no_warnings": True,
        "socket_timeout": timeout,
        # Use browser cookies as fallback if no cookies.txt
        "extractor_args": {"instagram": {"skip": ["dash"]}},
    }
    if COOKIES_FILE.exists():
        opts["cookiefile"] = str(COOKIES_FILE)
    return opts


# ── Metadata extraction ──────────────────────────────────────────────

async def extract_info(url: str, timeout: float = 15.0) -> dict[str, Any]:
    """
    Extract video metadata without downloading.
    Runs yt-dlp in a thread pool to avoid blocking the event loop.
    """
    ydl_opts = {
        **_base_opts(timeout),
        "skip_download": True,
        "ignoreerrors": False,
        "extract_flat": False,
    }

    def _extract():
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            return ydl.extract_info(url, download=False)

    loop = asyncio.get_running_loop()
    info = await asyncio.wait_for(
        loop.run_in_executor(None, _extract),
        timeout=timeout + 5,
    )
    return _normalise_info(info)


def _normalise_info(info: dict) -> dict[str, Any]:
    """Transform raw yt-dlp info dict into the shape the frontend expects."""
    formats = info.get("formats") or []

    video_formats = []
    audio_formats = []
    seen_resolutions = set()

    for f in formats:
        height = f.get("height")
        vcodec = f.get("vcodec", "none")
        acodec = f.get("acodec", "none")
        ext = f.get("ext", "")
        format_id = f.get("format_id", "")
        filesize = f.get("filesize") or f.get("filesize_approx")

        # Video formats (may or may not include audio)
        if height and vcodec != "none":
            label = f"{height}p"
            if label not in seen_resolutions:
                seen_resolutions.add(label)
                has_audio = acodec != "none"
                video_formats.append({
                    "format_id": format_id,
                    "label": label,
                    "height": height,
                    "ext": ext,
                    "has_audio": has_audio,
                    "filesize": filesize,
                    "type": "video+audio" if has_audio else "video_only",
                })

        # Audio-only formats
        if vcodec == "none" and acodec != "none":
            abr = f.get("abr") or f.get("tbr")
            audio_formats.append({
                "format_id": format_id,
                "label": f"{int(abr)}kbps" if abr else "audio",
                "ext": ext,
                "abr": abr,
                "filesize": filesize,
                "type": "audio_only",
            })

    # Sort: highest resolution / bitrate first
    video_formats.sort(key=lambda x: x["height"], reverse=True)
    audio_formats.sort(key=lambda x: (x.get("abr") or 0), reverse=True)

    duration = info.get("duration") or 0

    # For platforms that return a single combined format (e.g. Instagram, TikTok),
    # ensure at least one video format entry exists.
    if not video_formats and not audio_formats and info.get("url"):
        video_formats.append({
            "format_id": "best",
            "label": f"{info.get('height', 720)}p" if info.get("height") else "best",
            "height": info.get("height") or 720,
            "ext": info.get("ext", "mp4"),
            "has_audio": True,
            "filesize": info.get("filesize") or info.get("filesize_approx"),
            "type": "video+audio",
        })

    return {
        "id": info.get("id"),
        "title": info.get("title", "Untitled"),
        "thumbnail": info.get("thumbnail"),
        "channel": info.get("uploader") or info.get("channel") or info.get("uploader_id") or "Unknown",
        "duration": duration,
        "duration_string": _fmt_duration(duration),
        "video_formats": video_formats,
        "audio_formats": audio_formats,
        "webpage_url": info.get("webpage_url") or info.get("url"),
    }


def _fmt_duration(seconds: int) -> str:
    if not seconds:
        return "0:00"
    h, remainder = divmod(int(seconds), 3600)
    m, s = divmod(remainder, 60)
    if h:
        return f"{h}:{m:02}:{s:02}"
    return f"{m}:{s:02}"


# ── Download ──────────────────────────────────────────────────────────

async def download_media(
    url: str,
    quality_id: str | None = None,
    fmt: str = "mp4",
) -> Path:
    """
    Download the requested media to a temp file and return its path.
    The caller is responsible for cleanup (via BackgroundTasks).
    """
    uid = uuid.uuid4().hex[:12]

    if fmt == "mp3":
        out_template = str(TEMP_DIR / f"{uid}.%(ext)s")
        ydl_opts = {
            **_base_opts(30),
            "outtmpl": out_template,
            "format": "bestaudio/best",
            "postprocessors": [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }],
        }
    else:
        out_template = str(TEMP_DIR / f"{uid}.%(ext)s")
        # Prefer h264 codec for macOS QuickTime compatibility
        fmt_spec = f"{quality_id}[vcodec^=avc1]+bestaudio/best" if quality_id else "bestvideo[vcodec^=avc1]+bestaudio/best"
        ydl_opts = {
            **_base_opts(30),
            "outtmpl": out_template,
            "format": fmt_spec,
            "merge_output_format": "mp4",
            # Fallback if h264 is not available
            "format_sort": ["vcodec:h264", "res", "acodec:m4a"],
        }

    def _download():
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])

    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, _download)

    # yt-dlp may rename the extension after post-processing
    expected_ext = "mp3" if fmt == "mp3" else "mp4"
    result_path = TEMP_DIR / f"{uid}.{expected_ext}"
    if result_path.exists():
        return result_path

    # Fallback: find any file starting with uid
    for p in TEMP_DIR.iterdir():
        if p.name.startswith(uid):
            return p

    raise FileNotFoundError("Download completed but output file not found.")
