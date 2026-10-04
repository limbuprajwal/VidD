"use client";

import { useState, useCallback } from "react";
import URLInput from "@/components/URLInput";
import VideoCard from "@/components/VideoCard";
import HistoryPanel from "@/components/HistoryPanel";
import Toast from "@/components/Toast";
import { VideoInfo, Platform, fetchVideoInfo } from "@/utils/api";

function detectPlatformFromUrl(url: string): Platform {
  if (/youtu\.?be/i.test(url)) return "youtube";
  if (/facebook\.com|fb\.watch/i.test(url)) return "facebook";
  if (/instagram\.com|instagr\.am/i.test(url)) return "instagram";
  if (/tiktok\.com/i.test(url)) return "tiktok";
  if (/twitter\.com|x\.com/i.test(url)) return "twitter";
  return null;
}

export default function Home() {
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  const platform = detectPlatformFromUrl(currentUrl);

  const handleSubmit = useCallback(async (url: string) => {
    setCurrentUrl(url);
    setIsLoading(true);
    setError(null);
    setInfo(null);

    try {
      const result = await fetchVideoInfo(url);
      setInfo(result);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleHistorySelect = useCallback(
    (url: string) => {
      handleSubmit(url);
    },
    [handleSubmit]
  );

  return (
    <main className="flex-1 flex flex-col">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[#0a0a0f]" />
        <div className="absolute top-[-40%] left-[-20%] w-[80%] h-[80%] rounded-full bg-purple-600/8 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-30%] right-[-15%] w-[70%] h-[70%] rounded-full bg-pink-600/8 blur-[120px] animate-pulse-slow animation-delay-2000" />
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 blur-[100px] animate-pulse-slow animation-delay-4000" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="fixed inset-0 -z-10 opacity-[0.015]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* History button (top right) */}
      <div className="fixed top-5 right-5 z-30">
        <button
          onClick={() => setHistoryOpen(true)}
          className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-white/60 hover:text-white transition-all duration-200 backdrop-blur-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm font-medium">History</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24">
        {/* Hero */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/50 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            YouTube · Facebook · Instagram · TikTok · X
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
              Video
            </span>{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
              Downloader
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-white/40 max-w-md mx-auto leading-relaxed">
            Paste a link, pick your quality, and download videos or audio — fast, free, and private.
          </p>
        </div>

        {/* Input */}
        <div className="w-full animate-fade-in animation-delay-200">
          <URLInput
            onSubmit={handleSubmit}
            isLoading={isLoading}
            detectedPlatform={platform}
          />
        </div>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="w-full max-w-2xl mx-auto mt-8 animate-fade-in">
            <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden p-5">
              <div className="animate-pulse space-y-4">
                <div className="aspect-video bg-white/5 rounded-xl" />
                <div className="h-5 bg-white/5 rounded-lg w-3/4" />
                <div className="h-4 bg-white/5 rounded-lg w-1/3" />
                <div className="flex gap-2">
                  <div className="h-10 bg-white/5 rounded-lg flex-1" />
                  <div className="h-10 bg-white/5 rounded-lg flex-1" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {info && !isLoading && <VideoCard info={info} />}

        {/* Features */}
        {!info && !isLoading && (
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl animate-fade-in animation-delay-400">
            {[
              {
                icon: "⚡",
                title: "Lightning Fast",
                desc: "Extract metadata in seconds",
              },
              {
                icon: "🎬",
                title: "Multiple Formats",
                desc: "MP4 video or MP3 audio",
              },
              {
                icon: "🔒",
                title: "Private & Secure",
                desc: "No data stored on server",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all duration-300 group"
              >
                <div className="text-2xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  {f.icon}
                </div>
                <h3 className="text-sm font-semibold text-white/80">
                  {f.title}
                </h3>
                <p className="mt-1 text-xs text-white/30">{f.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-white/20">
        Built with FastAPI + Next.js · For personal use only
      </footer>

      {/* History Panel */}
      <HistoryPanel
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelectUrl={handleHistorySelect}
      />

      {/* Toast */}
      {error && (
        <Toast message={error} type="error" onClose={() => setError(null)} />
      )}
    </main>
  );
}
