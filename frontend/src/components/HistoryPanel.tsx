"use client";

import { useState, useEffect } from "react";
import {
  HistoryEntry,
  Platform,
  getHistory,
  clearHistory,
  removeFromHistory,
} from "@/utils/api";

function PlatformBadge({ platform }: { platform: Platform }) {
  const colors: Record<string, string> = {
    youtube: "bg-red-500/20 text-red-400",
    facebook: "bg-blue-500/20 text-blue-400",
    instagram: "bg-pink-500/20 text-pink-400",
    tiktok: "bg-white/10 text-white/70",
    twitter: "bg-sky-500/20 text-sky-400",
  };

  return platform ? (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
        colors[platform] || "bg-white/10 text-white/50"
      }`}
    >
      {platform}
    </span>
  ) : null;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUrl: (url: string) => void;
}

export default function HistoryPanel({
  isOpen,
  onClose,
  onSelectUrl,
}: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (isOpen) {
      setHistory(getHistory());
    }
  }, [isOpen]);

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  const handleRemove = (id: string) => {
    removeFromHistory(id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[#0d0d14]/95 border-l border-white/10 backdrop-blur-2xl shadow-2xl transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
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
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">History</h2>
              <p className="text-xs text-white/40">
                {history.length} download{history.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={handleClear}
                className="text-xs text-red-400/70 hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-73px)] p-3 space-y-2">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/20">
              <svg
                className="w-16 h-16 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <p className="text-sm font-medium">No downloads yet</p>
              <p className="text-xs mt-1">Your download history will appear here</p>
            </div>
          ) : (
            history.map((entry) => (
              <div
                key={entry.id}
                className="group flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-200"
              >
                {/* Thumbnail */}
                <div
                  className="flex-shrink-0 w-20 h-14 rounded-lg bg-white/5 overflow-hidden cursor-pointer"
                  onClick={() => {
                    onSelectUrl(entry.url);
                    onClose();
                  }}
                >
                  {entry.thumbnail ? (
                    <img
                      src={entry.thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/10">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium text-white/80 line-clamp-1 cursor-pointer hover:text-white transition-colors"
                    onClick={() => {
                      onSelectUrl(entry.url);
                      onClose();
                    }}
                  >
                    {entry.title}
                  </p>
                  <p className="text-xs text-white/30 mt-0.5">{entry.channel}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <PlatformBadge platform={entry.platform} />
                    <span className="text-[10px] text-white/25 font-medium uppercase">
                      {entry.format} · {entry.quality}
                    </span>
                    <span className="text-[10px] text-white/20">
                      {timeAgo(entry.downloadedAt)}
                    </span>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => handleRemove(entry.id)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
