# 🎬 Video Downloader

A modern, full-stack web application to download YouTube and Facebook videos (including Shorts & Reels) in various qualities and formats.

![Stack](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Stack](https://img.shields.io/badge/Next.js-000?style=flat-square&logo=nextdotjs&logoColor=white)
![Stack](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Stack](https://img.shields.io/badge/yt--dlp-FF0000?style=flat-square&logo=youtube&logoColor=white)

---

## ✨ Features

- **YouTube, Facebook, Instagram, TikTok & X (Twitter) support** — including Shorts and Reels
- **Video (MP4) & Audio (MP3)** download options
- **Multiple resolutions** — 1080p, 720p, 480p, 360p, etc.
- **Real-time metadata preview** — thumbnail, title, channel, duration
- **Local Download History** — easily revisit previously downloaded videos
- **FFmpeg-powered merging** — for high-res streams with separate audio
- **Auto-cleanup** — temp files deleted after each download
- **Rate-limited** — built-in abuse prevention
- **Responsive dark-mode UI** — glassmorphism design with smooth animations

---

## 📁 Project Structure

```
video-downloader-app/
├── backend/
│   ├── main.py              # FastAPI app + CORS + rate-limiting
│   ├── routes.py            # /api/info and /api/download endpoints
│   ├── services.py          # yt-dlp wrapper (metadata + download)
│   ├── utils.py             # URL validation, file cleanup helpers
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # Container with FFmpeg
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   ├── components/      # URLInput, VideoCard, Toast
│   │   └── utils/api.ts     # API client + TypeScript types
│   ├── package.json
│   └── ...
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

| Dependency | Install |
|------------|---------|
| **Python 3.10+** | [python.org](https://python.org) |
| **Node.js 18+** | [nodejs.org](https://nodejs.org) |
| **FFmpeg** | `brew install ffmpeg` (macOS) · `sudo apt install ffmpeg` (Linux) |

### 1. Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the API server
uvicorn main:app --reload --port 8000
```

The API is now live at **http://localhost:8000** (docs at `/docs`).

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

The app is now live at **http://localhost:3000**.

---

## 🚀 Deployment (Vercel & Free Tier)

Since you plan to use Vercel's free plan, here is the recommended deployment strategy:

### 1. Frontend (Vercel)
The Next.js frontend is perfectly suited for Vercel.
1. Push the `frontend` folder to GitHub.
2. Import the project in Vercel.
3. Set the Framework Preset to **Next.js**.
4. Set the Root Directory to `frontend`.
5. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-url.com`

### 2. Backend (Render, Railway, or Fly.io)
Vercel Serverless Functions have a 10-second timeout on the free tier and a 50MB deployment limit, which is incompatible with `yt-dlp` (often takes longer) and `FFmpeg` (binary size is too large).

You should host the FastAPI backend on a free/cheap VPS or container service (like Render web services, Railway, or Fly.io) using the provided `Dockerfile`.

1. Deploy the `backend` folder via Docker.
2. Ensure the `ALLOWED_ORIGINS` environment variable is set to your Vercel frontend URL (e.g., `https://your-app.vercel.app`) to allow CORS.

---

## 🐳 Docker (Backend)

```bash
cd backend
docker build -t video-dl-api .
docker run -p 8000:8000 video-dl-api
```

---

## 📡 API Reference

### Environment Variables
- `ALLOWED_ORIGINS`: Comma-separated list of allowed frontend domains (e.g. `https://my-frontend.vercel.app`) for CORS.

### `POST /api/info`

Extract video metadata without downloading. Supported for YouTube, Facebook, Instagram, TikTok, and X.

**Request:**
```json
{ "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
```

**Response:**
```json
{
  "id": "dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up",
  "thumbnail": "https://...",
  "channel": "Rick Astley",
  "duration": 212,
  "duration_string": "3:32",
  "platform": "youtube",
  "video_formats": [
    { "format_id": "137", "label": "1080p", "height": 1080, "filesize": 25000000, "type": "video_only" }
  ],
  "audio_formats": [
    { "format_id": "140", "label": "128kbps", "ext": "m4a", "type": "audio_only" }
  ]
}
```

### `GET /api/download`

Download the media file.

| Param | Type | Description |
|-------|------|-------------|
| `url` | string | Video URL (required) |
| `quality_id` | string | yt-dlp format ID (optional) |
| `format` | string | `mp4` or `mp3` (default: `mp4`) |

Returns a binary stream with `Content-Disposition: attachment`.

---

## ⚠️ Important Notes

1. **FFmpeg is required** — yt-dlp uses FFmpeg to merge separate video+audio streams (common for 1080p+ on YouTube). Ensure it's installed and on your `$PATH`.

2. **Keep yt-dlp updated** — YouTube frequently changes its internal APIs. Run:
   ```bash
   pip install -U yt-dlp
   ```

3. **For personal use only** — Downloading copyrighted content without permission may violate terms of service. Use responsibly.

---

## 📝 License

MIT
