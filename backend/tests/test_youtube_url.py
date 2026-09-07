import pytest

from src.utils.youtube_url import extract_youtube_video_id, sanitize_video_id_or_raise


def test_extract_exact_11_char_id():
    assert extract_youtube_video_id("dQw4w9WgXcQ") == "dQw4w9WgXcQ"
    assert extract_youtube_video_id("M576WGiDBdQ") == "M576WGiDBdQ"
    assert extract_youtube_video_id("y881t8ilMyc") == "y881t8ilMyc"


def test_extract_standard_watch_urls():
    assert extract_youtube_video_id("https://www.youtube.com/watch?v=dQw4w9WgXcQ") == "dQw4w9WgXcQ"
    assert extract_youtube_video_id("http://youtube.com/watch?v=M576WGiDBdQ") == "M576WGiDBdQ"
    assert extract_youtube_video_id("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=45s") == "dQw4w9WgXcQ"
    assert extract_youtube_video_id("https://www.youtube.com/watch?feature=share&v=y881t8ilMyc&ab_channel=AI") == "y881t8ilMyc"


def test_extract_short_urls():
    assert extract_youtube_video_id("https://youtu.be/dQw4w9WgXcQ") == "dQw4w9WgXcQ"
    assert extract_youtube_video_id("https://youtu.be/M576WGiDBdQ?t=10s") == "M576WGiDBdQ"


def test_extract_shorts_and_embeds():
    assert extract_youtube_video_id("https://www.youtube.com/shorts/M576WGiDBdQ") == "M576WGiDBdQ"
    assert extract_youtube_video_id("https://www.youtube.com/embed/y881t8ilMyc") == "y881t8ilMyc"
    assert extract_youtube_video_id("https://www.youtube.com/live/dQw4w9WgXcQ") == "dQw4w9WgXcQ"


def test_extract_invalid_formats():
    assert extract_youtube_video_id("") is None
    assert extract_youtube_video_id("invalid") is None
    assert extract_youtube_video_id("https://vimeo.com/12345678") is None
    assert extract_youtube_video_id("https://youtube.com/user/channel") is None


def test_sanitize_video_id_or_raise():
    assert sanitize_video_id_or_raise("https://youtu.be/dQw4w9WgXcQ") == "dQw4w9WgXcQ"
    with pytest.raises(ValueError, match="Invalid YouTube video identifier"):
        sanitize_video_id_or_raise("bad_url")
