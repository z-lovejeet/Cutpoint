/**
 * Client-side YouTube URL parser and video ID extraction utilities.
 * Handles desktop URLs, youtu.be, Shorts, embed URLs, and raw 11-char IDs.
 */

const YOUTUBE_PATTERNS = [
  // Standard query param: youtube.com/watch?v=ID
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:[^&\n]*&)*v=([a-zA-Z0-9_-]{11})/,
  // Short URL: youtu.be/ID
  /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
  // YouTube Shorts: youtube.com/shorts/ID
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  // Embed URL: youtube.com/embed/ID
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  // Direct /v/ URL: youtube.com/v/ID
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  // Live stream: youtube.com/live/ID
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  // Exact 11-char ID
  /^([a-zA-Z0-9_-]{11})$/,
];

/**
 * Extracts an 11-character YouTube video ID from a URL or raw ID string.
 */
export function extractYouTubeVideoId(input: string): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();

  // Fast-path exact match
  if (trimmed.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  for (const pattern of YOUTUBE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Verifies if a string is a valid YouTube video ID.
 */
export function isValidYouTubeVideoId(id: string): boolean {
  return typeof id === "string" && /^[a-zA-Z0-9_-]{11}$/.test(id.trim());
}

/**
 * Converts total seconds into MM:SS format.
 */
export function formatTimestampSeconds(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00";
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Formats duration into human-readable representation (e.g., 14m 20s).
 */
export function formatDuration(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds <= 0) return "0s";
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}h ${mins}m ${secs}s`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Maps retention health score (0-100) to letter grade and color class.
 */
export function getRetentionGrade(score: number): {
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  color: string;
  bg: string;
} {
  if (score >= 90) return { grade: "A+", color: "text-emerald-700", bg: "bg-emerald-50" };
  if (score >= 80) return { grade: "A", color: "text-emerald-600", bg: "bg-emerald-50" };
  if (score >= 70) return { grade: "B", color: "text-amber-700", bg: "bg-amber-50" };
  if (score >= 60) return { grade: "C", color: "text-orange-700", bg: "bg-orange-50" };
  if (score >= 50) return { grade: "D", color: "text-red-600", bg: "bg-red-50" };
  return { grade: "F", color: "text-red-700", bg: "bg-red-100" };
}
