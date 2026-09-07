"""
Signal processing utilities for retention curve analysis.
Uses NumPy and SciPy for gradient detection, z-score anomalies,
sliding window drop calculation, and deterministic health score computation.
"""
from typing import Any, Dict, List, Tuple

import numpy as np
from scipy.ndimage import gaussian_filter1d
from scipy.signal import argrelextrema
from scipy.stats import zscore


def compute_smoothed_gradient(
    retention: np.ndarray,
    time_sec: np.ndarray,
    sigma: float = 2.0,
) -> np.ndarray:
    """Gaussian-smooth retention curve and compute first derivative (d_retention / d_time)."""
    if len(retention) < 2:
        return np.zeros_like(retention, dtype=float)

    # Apply Gaussian smoothing
    smoothed = gaussian_filter1d(retention.astype(float), sigma=sigma)

    # Ensure time_sec has strictly positive deltas to avoid divide-by-zero
    dt = np.diff(time_sec)
    if np.any(dt <= 0):
        # Fallback to uniform indexing if time points are non-monotonic/duplicate
        gradient = np.gradient(smoothed)
    else:
        gradient = np.gradient(smoothed, time_sec)

    return gradient


def find_gradient_drops(
    gradient: np.ndarray,
    threshold: float = -0.05,
) -> np.ndarray:
    """Find indices where gradient has local minima (steepest descent) below threshold."""
    if len(gradient) < 5:
        # Fallback for short sequences: simple thresholding
        return np.where(gradient < threshold)[0]

    # Local minima in gradient (points of maximum downward rate of change)
    minima_indices = argrelextrema(gradient, np.less, order=2)[0]
    if len(minima_indices) == 0:
        return np.where(gradient < threshold)[0]

    # Filter minima that surpass negative rate threshold
    filtered = minima_indices[gradient[minima_indices] < threshold]
    return filtered


def find_zscore_anomalies(
    gradient: np.ndarray,
    z_threshold: float = -2.0,
) -> np.ndarray:
    """Find indices where gradient z-score falls below z_threshold (negative outlier drops)."""
    if len(gradient) < 3:
        return np.array([], dtype=int)

    std_dev = np.std(gradient)
    if std_dev == 0 or np.isnan(std_dev):
        return np.array([], dtype=int)

    z_scores = zscore(gradient, nan_policy="omit")
    anomalies = np.where(z_scores < z_threshold)[0]
    return anomalies


def find_sliding_window_drops(
    retention: np.ndarray,
    time_sec: np.ndarray,
    window_ratio: float = 0.05,
    min_drop_pct: float = 3.0,
) -> List[Tuple[int, float]]:
    """Slide a temporal window across retention points and find drops exceeding min_drop_pct."""
    n = len(retention)
    if n < 3:
        return []

    window_size = max(2, int(n * window_ratio))
    drops: List[Tuple[int, float]] = []

    for i in range(n - window_size):
        start_val = retention[i]
        end_val = retention[i + window_size]
        drop_pct = (start_val - end_val) * 100.0
        if drop_pct >= min_drop_pct:
            drops.append((i, float(drop_pct)))

    return drops


def debounce_candidates(
    indices: np.ndarray,
    time_sec: np.ndarray,
    min_gap_seconds: float = 5.0,
) -> np.ndarray:
    """Merge candidates that are closer together in time than min_gap_seconds."""
    if len(indices) == 0:
        return np.array([], dtype=int)

    # Sort indices by their actual timestamps
    sorted_indices = sorted(indices, key=lambda idx: time_sec[idx])
    clusters: List[List[int]] = [[sorted_indices[0]]]

    for idx in sorted_indices[1:]:
        last_cluster = clusters[-1]
        if time_sec[idx] - time_sec[last_cluster[-1]] < min_gap_seconds:
            last_cluster.append(idx)
        else:
            clusters.append([idx])

    # Pick the representative index from each cluster (median index)
    representatives = [c[len(c) // 2] for c in clusters]
    return np.array(representatives, dtype=int)


def calculate_health_score(
    cliffs: list,
    video_duration_seconds: float = 600.0,
) -> Dict[str, Any]:
    """
    Deterministic health score calculation.
    Formula: Score = 100 - Σ(weight × drop_pct × confidence) - (total_cliffs × 1.5) - penalties
    """
    score = 100.0
    content_penalty = 0.0
    pacing_penalty = 0.0
    audio_penalty = 0.0
    visual_penalty = 0.0
    hook_penalty = 0.0

    severity_weight_map = {
        "CRITICAL": 1.5,
        "HIGH": 1.2,
        "MEDIUM": 1.0,
        "LOW": 0.7,
    }

    for cliff in cliffs:
        # Handle dict or object attributes
        severity_val = getattr(cliff, "severity", None) or (cliff.get("severity") if isinstance(cliff, dict) else "MEDIUM")
        severity_str = severity_val.value if hasattr(severity_val, "value") else str(severity_val)
        drop_pct = getattr(cliff, "drop_percentage", None) or (cliff.get("drop_percentage", 5.0) if isinstance(cliff, dict) else 5.0)
        confidence = getattr(cliff, "detection_confidence", None) or (cliff.get("detection_confidence", 0.8) if isinstance(cliff, dict) else 0.8)
        ts_start = getattr(cliff, "timestamp_start", None) or (cliff.get("timestamp_start", 0.0) if isinstance(cliff, dict) else 0.0)
        position = getattr(cliff, "position_in_video", None) or (cliff.get("position_in_video", "middle") if isinstance(cliff, dict) else "middle")

        weight = severity_weight_map.get(severity_str, 1.0)
        base_deduction = weight * drop_pct * confidence * 0.8

        # Early drop penalty (first 30 seconds hurts hook substantially)
        if ts_start < 30.0:
            base_deduction *= 2.0
            hook_penalty += base_deduction * 0.6
            pacing_penalty += base_deduction * 0.2
        elif position == "early":
            hook_penalty += base_deduction * 0.4
            pacing_penalty += base_deduction * 0.3
        elif position == "middle":
            content_penalty += base_deduction * 0.4
            pacing_penalty += base_deduction * 0.3
            visual_penalty += base_deduction * 0.2
            audio_penalty += base_deduction * 0.1
        else:  # late
            content_penalty += base_deduction * 0.3
            pacing_penalty += base_deduction * 0.3

        score -= base_deduction

    # Total cliff count penalty
    score -= len(cliffs) * 1.5

    # Cluster penalty: cliffs within 60s of each other
    if len(cliffs) > 1:
        def get_ts(c):
            return getattr(c, "timestamp_start", None) or (c.get("timestamp_start", 0.0) if isinstance(c, dict) else 0.0)

        sorted_cliffs = sorted(cliffs, key=get_ts)
        for i in range(1, len(sorted_cliffs)):
            if get_ts(sorted_cliffs[i]) - get_ts(sorted_cliffs[i - 1]) < 60.0:
                score -= 4.0
                pacing_penalty += 4.0

    score = max(5.0, min(100.0, score))

    # Grade assignment
    if score >= 90.0:
        grade = "A"
    elif score >= 80.0:
        grade = "B"
    elif score >= 70.0:
        grade = "C"
    elif score >= 60.0:
        grade = "D"
    else:
        grade = "F"

    return {
        "overall": round(score, 1),
        "grade": grade,
        "content_score": round(max(10.0, 100.0 - content_penalty), 1),
        "pacing_score": round(max(10.0, 100.0 - pacing_penalty), 1),
        "audio_score": round(max(10.0, 100.0 - audio_penalty), 1),
        "visual_score": round(max(10.0, 100.0 - visual_penalty), 1),
        "hook_score": round(max(10.0, 100.0 - hook_penalty), 1),
    }
