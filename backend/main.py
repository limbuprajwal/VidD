"""FastAPI application setup with CORS and rate-limiting."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from routes import router

# ── Rate Limiter ─────────────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address, default_limits=["30/minute"])

# ── App ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="Video Downloader API",
    version="1.0.0",
    description="Download YouTube, Facebook, Instagram, TikTok videos/audio via yt-dlp",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ─────────────────────────────────────────────────────────────
# Accept localhost for dev, plus any Vercel preview/production domains.
# Set ALLOWED_ORIGINS env var as comma-separated list for production.

_default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
_env_origins = os.getenv("ALLOWED_ORIGINS", "")
_extra_origins = [o.strip() for o in _env_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_default_origins + _extra_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ───────────────────────────────────────────────────────────

app.include_router(router)


@app.get("/health")
async def health():
    return {"status": "ok"}
