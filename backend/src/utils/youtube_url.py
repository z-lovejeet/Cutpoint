"""
YouTube URL and video ID parsing and normalization utility.
Supports extracting clean 11-character YouTube video IDs from raw IDs,
standard watch URLs, shortened URLs, Shorts, and embed links.
"""
import re
from typing import Optional

# Pre-compiled regex patterns for various YouTube URL representations
YOUTUBE_PATTERNS = [
    # Standard query param: youtube.com/watch?v=ID (supports additional params)
    re.compile(r"(?:https?://)?(?:www\.)?youtube\.com/watch\?(?:[^&\n]*&)*v=([a-zA-Z0-9_-]{11})"),
    # Short URL: youtu.be/ID
    re.compile(r"(?:https?://)?(?:www\.)?youtu\.be/([a-zA-Z0-9_-]{11})"),
    # YouTube Shorts: youtube.com/shorts/ID
    re.compile(r"(?:https?://)?(?:www\.)?youtube\.com/shorts/([a-zA-Z0-9_-]{11})"),
    # Embed URL: youtube.com/embed/ID
    re.compile(r"(?:https?://)?(?:www\.)?youtube\.com/embed/([a-zA-Z0-9_-]{11})"),
    # Direct /v/ URL: youtube.com/v/ID
    re.compile(r"(?:https?://)?(?:www\.)?youtube\.com/v/([a-zA-Z0-9_-]{11})"),
    # Live stream: youtube.com/live/ID
    re.compile(r"(?:https?://)?(?:www\.)?youtube\.com/live/([a-zA-Z0-9_-]{11})"),
    # Exact 11-char video ID
    re.compile(r"^([a-zA-Z0-9_-]{11})$"),
]


def extract_youtube_video_id(input_str: str) -> Optional[str]:
    """
    Extracts and normalizes an 11-character YouTube video ID from a URL or raw ID string.
    Returns None if no valid ID can be parsed.
    """
    if not input_str or not isinstance(input_str, str):
        return None

    cleaned = input_str.strip()

    # Fast-path check for exact 11-char ID
    if len(cleaned) == 11 and re.match(r"^[a-zA-Z0-9_-]{11}$", cleaned):
        return cleaned

    for pattern in YOUTUBE_PATTERNS:
        match = pattern.search(cleaned)
        if match:
            return match.group(1)

    return None


def sanitize_video_id_or_raise(input_str: str) -> str:
    """
    Extracts an 11-character YouTube video ID or raises a ValueError.
    """
    extracted = extract_youtube_video_id(input_str)
    if not extracted:
        raise ValueError(
            f"Invalid YouTube video identifier: '{input_str}'. "
            "Please provide a valid 11-character video ID or YouTube URL."
        )
    return extracted
