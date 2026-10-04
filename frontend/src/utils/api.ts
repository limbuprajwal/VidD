const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type Platform = "youtube" | "facebook" | "instagram" | "tiktok" | "twitter" | null;

export interface VideoFormat {
  format_id: string;
  label: string;
  height?: number;
  ext: string;
  has_audio?: boolean;
  filesize: number | null;
  type: string;
  abr?: number;
}

export interface VideoInfo {
  id: string;
  title: string;
  thumbnail: string | null;
  channel: string;
  duration: number;
  duration_string: string;
  video_formats: VideoFormat[];
  audio_formats: VideoFormat[];
  webpage_url: string;
  platform: Platform;
}

export interface HistoryEntry {
  id: string;
  title: string;
  thumbnail: string | null;
  channel: string;
  platform: Platform;
  url: string;
  downloadedAt: string;
  format: "mp4" | "mp3";
  quality: string;
}

export async function fetchVideoInfo(url: string): Promise<VideoInfo> {
  const res = await fetch(`${API_BASE}/api/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `Server error (${res.status})`);
  }

  return res.json();
}

export function getDownloadUrl(
  url: string,
  qualityId: string | null,
  format: "mp4" | "mp3"
): string {
  const params = new URLSearchParams({ url, format });
  if (qualityId) params.set("quality_id", qualityId);
  return `${API_BASE}/api/download?${params.toString()}`;
}

// ── History (localStorage) ────────────────────────────────────────

const HISTORY_KEY = "vdl_history";
const MAX_HISTORY = 50;

export function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToHistory(entry: Omit<HistoryEntry, "id" | "downloadedAt">): void {
  const history = getHistory();
  const newEntry: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    downloadedAt: new Date().toISOString(),
  };
  // Prepend and cap at MAX_HISTORY
  const updated = [newEntry, ...history].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export function removeFromHistory(id: string): void {
  const history = getHistory().filter((h) => h.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}
