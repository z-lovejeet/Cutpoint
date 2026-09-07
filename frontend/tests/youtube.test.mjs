import test from "node:test";
import assert from "node:assert/strict";

// Mirroring the client-side parsing logic to test in node native test runner
const YOUTUBE_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:[^&\n]*&)*v=([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  /^([a-zA-Z0-9_-]{11})$/,
];

function extractYouTubeVideoId(input) {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
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

function formatTimestampSeconds(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00";
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function formatDuration(totalSeconds) {
  if (isNaN(totalSeconds) || totalSeconds <= 0) return "0s";
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function getRetentionGrade(score) {
  if (score >= 90) return { grade: "A+" };
  if (score >= 80) return { grade: "A" };
  if (score >= 70) return { grade: "B" };
  if (score >= 60) return { grade: "C" };
  if (score >= 50) return { grade: "D" };
  return { grade: "F" };
}

test("extractYouTubeVideoId extracts 11-char ID from all valid formats", () => {
  assert.equal(extractYouTubeVideoId("M576WGiDBdQ"), "M576WGiDBdQ");
  assert.equal(extractYouTubeVideoId("https://www.youtube.com/watch?v=M576WGiDBdQ"), "M576WGiDBdQ");
  assert.equal(extractYouTubeVideoId("https://www.youtube.com/watch?feature=share&v=M576WGiDBdQ&t=30s"), "M576WGiDBdQ");
  assert.equal(extractYouTubeVideoId("https://youtu.be/M576WGiDBdQ"), "M576WGiDBdQ");
  assert.equal(extractYouTubeVideoId("https://www.youtube.com/shorts/M576WGiDBdQ"), "M576WGiDBdQ");
  assert.equal(extractYouTubeVideoId("https://www.youtube.com/embed/M576WGiDBdQ"), "M576WGiDBdQ");
});

test("extractYouTubeVideoId rejects invalid strings", () => {
  assert.equal(extractYouTubeVideoId(""), null);
  assert.equal(extractYouTubeVideoId("invalid"), null);
  assert.equal(extractYouTubeVideoId("too_short"), null);
  assert.equal(extractYouTubeVideoId("this_string_is_way_too_long_to_be_an_id"), null);
  assert.equal(extractYouTubeVideoId("https://vimeo.com/99999999"), null);
  assert.equal(extractYouTubeVideoId("not a video id with spaces!"), null);
});

test("formatTimestampSeconds formats mm:ss accurately", () => {
  assert.equal(formatTimestampSeconds(0), "00:00");
  assert.equal(formatTimestampSeconds(84), "01:24");
  assert.equal(formatTimestampSeconds(600), "10:00");
});

test("formatDuration formats human readable durations", () => {
  assert.equal(formatDuration(45), "45s");
  assert.equal(formatDuration(740), "12m 20s");
  assert.equal(formatDuration(3665), "1h 1m 5s");
});

test("getRetentionGrade maps score to letter grade", () => {
  assert.equal(getRetentionGrade(94).grade, "A+");
  assert.equal(getRetentionGrade(85).grade, "A");
  assert.equal(getRetentionGrade(72).grade, "B");
  assert.equal(getRetentionGrade(64).grade, "C");
  assert.equal(getRetentionGrade(52).grade, "D");
  assert.equal(getRetentionGrade(35).grade, "F");
});
