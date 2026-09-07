import numpy as np

from src.agents.mathematician import mathematician_agent
from src.models.domain import DetectionConfig, RetentionData, RetentionDataPoint


def create_synthetic_retention(drops: list[tuple[float, float]], duration: int = 600) -> RetentionData:
    """Creates synthetic retention data with specified drops [(ratio, magnitude)]."""
    num_points = 100
    time_ratios = np.linspace(0.0, 1.0, num_points)
    watch_ratios = np.ones(num_points)

    for drop_ratio, magnitude in drops:
        idx = int(drop_ratio * num_points)
        watch_ratios[idx:] -= magnitude

    watch_ratios = np.clip(watch_ratios, 0.05, 1.0)
    points = [
        RetentionDataPoint(
            time_ratio=float(tr),
            watch_ratio=float(wr),
            timestamp_seconds=float(tr * duration),
        )
        for tr, wr in zip(time_ratios, watch_ratios)
    ]
    return RetentionData(
        video_id="synthetic_test",
        data_points=points,
        total_duration_seconds=float(duration),
    )


def test_cliff_detection_flat_curve():
    # Perfectly flat retention with zero drops
    data = create_synthetic_retention(drops=[])
    result = mathematician_agent.detect_cliffs(data)
    assert len(result.cliffs) == 0


def test_cliff_detection_single_severe_drop():
    # Sharp 15% drop at 20% into video
    data = create_synthetic_retention(drops=[(0.20, 0.15)], duration=600)
    result = mathematician_agent.detect_cliffs(data)
    assert len(result.cliffs) >= 1
    cliff = result.cliffs[0]
    assert cliff.drop_percentage >= 10.0
    assert 100.0 <= cliff.timestamp_start <= 140.0  # 0.20 * 600 = 120s
    assert cliff.window_start <= cliff.timestamp_start
    assert cliff.window_end >= cliff.timestamp_start


def test_cliff_detection_multiple_drops():
    # Drop at 15% (-12%) and Drop at 60% (-10%)
    data = create_synthetic_retention(drops=[(0.15, 0.12), (0.60, 0.10)], duration=600)
    result = mathematician_agent.detect_cliffs(data)
    assert len(result.cliffs) >= 2
    # Ensure sorted by drop percentage descending
    assert result.cliffs[0].drop_percentage >= result.cliffs[1].drop_percentage


def test_cliff_detection_max_cliffs_constraint():
    # Many drops
    drops = [(0.1, 0.08), (0.2, 0.08), (0.3, 0.08), (0.4, 0.08), (0.5, 0.08), (0.6, 0.08)]
    data = create_synthetic_retention(drops=drops, duration=600)
    cfg = DetectionConfig(max_cliffs=3)
    result = mathematician_agent.detect_cliffs(data, config=cfg)
    assert len(result.cliffs) <= 3
