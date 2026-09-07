import numpy as np

from src.models.domain import CliffPoint, CliffSeverity
from src.utils.math_tools import (
    calculate_health_score,
    compute_smoothed_gradient,
    debounce_candidates,
    find_gradient_drops,
    find_sliding_window_drops,
    find_zscore_anomalies,
)


def test_compute_smoothed_gradient():
    # Linear retention decline
    time_sec = np.linspace(0, 100, 100)
    retention = 1.0 - 0.005 * time_sec  # slope = -0.005
    grad = compute_smoothed_gradient(retention, time_sec, sigma=1.0)
    assert len(grad) == 100
    assert np.allclose(grad[10:-10], -0.005, atol=0.002)


def test_find_gradient_drops():
    grad = np.zeros(100)
    grad[30] = -0.08  # sharp drop
    grad[70] = -0.06  # drop
    drops = find_gradient_drops(grad, threshold=-0.04)
    assert len(drops) >= 1
    assert 30 in drops or 70 in drops


def test_find_zscore_anomalies():
    grad = np.random.normal(loc=-0.002, scale=0.001, size=100)
    grad[45] = -0.035  # extreme outlier drop
    anomalies = find_zscore_anomalies(grad, z_threshold=-2.5)
    assert 45 in anomalies


def test_find_sliding_window_drops():
    time_sec = np.linspace(0, 100, 100)
    retention = np.ones(100)
    retention[50:] = 0.85  # 15% drop at index 50
    drops = find_sliding_window_drops(retention, time_sec, window_ratio=0.05, min_drop_pct=5.0)
    assert len(drops) > 0
    indices = [d[0] for d in drops]
    assert any(45 <= idx <= 55 for idx in indices)


def test_debounce_candidates():
    time_sec = np.linspace(0, 100, 100)
    # Indices 20, 21, 22 are 1 second apart
    indices = np.array([20, 21, 22, 60, 61])
    debounced = debounce_candidates(indices, time_sec, min_gap_seconds=5.0)
    assert len(debounced) == 2  # One from 20-22 cluster, one from 60-61 cluster


def test_calculate_health_score_perfect_curve():
    # Flawless video with zero cliffs
    res = calculate_health_score(cliffs=[], video_duration_seconds=600)
    assert res["overall"] == 100.0
    assert res["grade"] == "A"
    assert res["hook_score"] == 100.0


def test_calculate_health_score_with_severe_cliffs():
    cliffs = [
        CliffPoint(
            timestamp_start=15.0,
            timestamp_end=20.0,
            drop_percentage=16.0,
            severity=CliffSeverity.CRITICAL,
            retention_before=0.88,
            retention_after=0.72,
            position_in_video="early",
            detection_confidence=0.9,
        ),
        CliffPoint(
            timestamp_start=40.0,
            timestamp_end=45.0,
            drop_percentage=12.0,
            severity=CliffSeverity.HIGH,
            retention_before=0.70,
            retention_after=0.58,
            position_in_video="early",
            detection_confidence=0.85,
        ),
    ]
    res = calculate_health_score(cliffs=cliffs, video_duration_seconds=600)
    assert res["overall"] < 80.0
    assert res["hook_score"] < 90.0
    assert res["grade"] in ("C", "D", "F")
