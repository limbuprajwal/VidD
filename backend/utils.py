"""URL validation and file cleanup helpers."""

import os
import re
from pathlib import Path

YOUTUBE_PATTERNS = [
    r"(?:https?://)?(?:www\.)?youtube\.com/watch\?.*v=[\w-]+",
    r"(?:https?://)?(?:www\.)?youtube\.com/shorts/[\w-]+",
    r"(?:https?://)?youtu\.be/[\w-]+",
    r"(?:https?://)?(?:www\.)?youtube\.com/embed/[\w-]+",
    r"(?:https?://)?(?:m\.)?youtube\.com/watch\?.*v=[\w-]+",
    r"(?:https?://)?(?:www\.)?youtube\.com/live/[\w-]+",
]

FACEBOOK_PATTERNS = [
    r"(?:https?://)?(?:[\w-]+\.)?facebook\.com/.+/videos/.+",
    r"(?:https?://)?(?:[\w-]+\.)?facebook\.com/watch/?(\?.*)?",
    r"(?:https?://)?(?:[\w-]+\.)?facebook\.com/reel/\d+",
    r"(?:https?://)?(?:[\w-]+\.)?facebook\.com/.+/posts/.+",
    r"(?:https?://)?(?:[\w-]+\.)?facebook\.com/video\.php\?.*",
    r"(?:https?://)?(?:[\w-]+\.)?facebook\.com/share/v/.+",
    r"(?:https?://)?(?:[\w-]+\.)?facebook\.com/[\w.]+/videos/\d+",
    r"(?:https?://)?(?:[\w-]+\.)?facebook\.com/story\.php\?.*",
    r"(?:https?://)?fb\.watch/.+",
]

INSTAGRAM_PATTERNS = [
    r"(?:https?://)?(?:www\.)?instagram\.com/reel/[\w-]+",
    r"(?:https?://)?(?:www\.)?instagram\.com/reels?/[\w-]+",
    r"(?:https?://)?(?:www\.)?instagram\.com/p/[\w-]+",
    r"(?:https?://)?(?:www\.)?instagram\.com/tv/[\w-]+",
    r"(?:https?://)?(?:www\.)?instagram\.com/[\w.]+/reel/[\w-]+",
    r"(?:https?://)?(?:www\.)?instagram\.com/stories/[\w.]+/\d+",
    r"(?:https?://)?(?:www\.)?instagr\.am/p/[\w-]+",
]

TIKTOK_PATTERNS = [
    r"(?:https?://)?(?:www\.)?tiktok\.com/@[\w.]+/video/\d+",
    r"(?:https?://)?(?:www\.)?tiktok\.com/@[\w.]+/photo/\d+",
    r"(?:https?://)?vm\.tiktok\.com/[\w-]+",
    r"(?:https?://)?(?:www\.)?tiktok\.com/t/[\w-]+",
    r"(?:https?://)?(?:m\.)?tiktok\.com/v/\d+",
    r"(?:https?://)?(?:www\.)?tiktok\.com/@[\w.]+",
]

TWITTER_PATTERNS = [
    r"(?:https?://)?(?:www\.)?(?:twitter|x)\.com/\w+/status/\d+",
    r"(?:https?://)?(?:www\.)?x\.com/\w+/status/\d+",
]

ALL_PATTERNS = {
    "youtube": YOUTUBE_PATTERNS,
    "facebook": FACEBOOK_PATTERNS,
    "instagram": INSTAGRAM_PATTERNS,
    "tiktok": TIKTOK_PATTERNS,
    "twitter": TWITTER_PATTERNS,
}


def detect_platform(url: str) -> str | None:
    """Return the platform name if the URL matches, else None."""
    url = url.strip()
    for platform, patterns in ALL_PATTERNS.items():
        for pattern in patterns:
            if re.match(pattern, url, re.IGNORECASE):
                return platform
    return None


def is_supported_url(url: str) -> bool:
    """Check if the URL is a supported link."""
    return detect_platform(url) is not None


TEMP_DIR = Path(__file__).parent / "tmp_downloads"
TEMP_DIR.mkdir(exist_ok=True)


def cleanup_file(filepath: str) -> None:
    """Delete a temporary file if it exists."""
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
    except OSError:
        pass


def cleanup_temp_dir() -> None:
    """Remove all files in the temporary download directory."""
    for f in TEMP_DIR.iterdir():
        try:
            f.unlink()
        except OSError:
            pass
