"""
Agent 3: Cliff Detector Agent (The Mathematician)
Pure mathematical and signal processing agent.
Executes an ensemble of 3 signal algorithms with adaptive thresholding,
consensus voting, and self-tuning reflection loops.
"""
import logging
from typing import List, Optional

import numpy as np

from src.models.domain import (
    CliffPoint,
    CliffSeverity,
    DetectionConfig,
    DetectionResult,
    RetentionData,
)
from src.utils.math_tools import (
    compute_smoothed_gradient,
    debounce_candidates,
    find_gradient_drops,
    find_sliding_window_drops,
    find_zscore_anomalies,
)

logger = logging.getLogger(__name__)


class MathematicianAgent:
    """The Mathematician: Discovers statistically significant retention drop cliffs."""

    def __init__(self):
        self.name = "Cliff Detector Agent (The Mathematician)"

    def detect_cliffs(
        self,
        retention_data: RetentionData,
        config: Optional[DetectionConfig] = None,
    ) -> DetectionResult:
        """
        Executes the multi-algorithm detection pipeline with self-tuning sensitivity.
        """
        cfg = config or DetectionConfig()
        points = retention_data.data_points
        if len(points) < 5:
            logger.warning("[%s] Insufficient data points (%d) to detect cliffs.", self.name, len(points))
            return DetectionResult(cliffs=[], config_used=cfg, iterations_needed=1, total_candidates_before_filter=0)

        time_sec = np.array([p.timestamp_seconds for p in points])
        retention = np.array([p.watch_ratio for p in points])
        duration = retention_data.total_duration_seconds or float(time_sec[-1])

        iterations = 0
        final_cliffs: List[CliffPoint] = []
        total_candidates = 0

        # Self-tuning sensitivity loop
        while iterations < 5:
            iterations += 1
            logger.info("[%s] Detection iteration %d with severity_threshold=%.3f, sigma=%.2f...",
                        self.name, iterations, cfg.severity_threshold, cfg.smoothing_sigma)

            # 1. Gradient algorithm
            gradient = compute_smoothed_gradient(retention, time_sec, sigma=cfg.smoothing_sigma)
            gradient_drop_indices = find_gradient_drops(gradient, threshold=-cfg.severity_threshold)

            # 2. Sliding window algorithm
            sliding_drops = find_sliding_window_drops(
                retention, time_sec, window_ratio=cfg.window_size_ratio, min_drop_pct=cfg.min_drop_percentage
            )
            sliding_indices = np.array([d[0] for d in sliding_drops], dtype=int)

            # 3. Z-score anomaly algorithm
            zscore_indices = find_zscore_anomalies(gradient, z_threshold=cfg.z_score_threshold)

            # Collect candidate indices
            candidate_votes: dict[int, list[str]] = {}
            for idx in gradient_drop_indices:
                candidate_votes.setdefault(idx, []).append("gradient")
            for idx in sliding_indices:
                candidate_votes.setdefault(idx, []).append("sliding_window")
            for idx in zscore_indices:
                candidate_votes.setdefault(idx, []).append("z_score")

            total_candidates = len(candidate_votes)

            # Ensemble consensus: at least 2 algorithms agree
            consensus_indices = [idx for idx, methods in candidate_votes.items() if len(methods) >= 2]

            # If too few consensus indices, allow single strong gradient drops >= 5%
            if len(consensus_indices) == 0:
                consensus_indices = list(candidate_votes.keys())

            debounced_indices = debounce_candidates(np.array(consensus_indices, dtype=int), time_sec, min_gap_seconds=5.0)

            # Formulate CliffPoint models
            current_cliffs: List[CliffPoint] = []
            for idx in debounced_indices:
                ts_start = float(time_sec[idx])
                # Find drop magnitude within window
                end_idx = min(len(retention) - 1, idx + max(2, int(len(retention) * cfg.window_size_ratio)))
                ts_end = float(time_sec[end_idx])
                ret_before = float(retention[idx])
                ret_after = float(retention[end_idx])
                drop_pct = max(0.0, (ret_before - ret_after) * 100.0)

                # If drop is below minimum requirement, clamp/filter
                if drop_pct < 5.0:
                    continue

                methods = candidate_votes.get(idx, ["gradient"])
                confidence = round((len(methods) / 3.0) * min(1.0, max(0.5, drop_pct / 10.0)), 2)

                # Position in video
                time_ratio = ts_start / max(1.0, duration)
                if time_ratio <= 0.20:
                    position = "early"
                elif time_ratio <= 0.80:
                    position = "middle"
                else:
                    position = "late"

                # Severity classification
                if drop_pct >= 15.0 or (drop_pct >= 10.0 and ts_start <= 60.0):
                    severity = CliffSeverity.CRITICAL
                elif drop_pct >= 10.0:
                    severity = CliffSeverity.HIGH
                elif drop_pct >= 7.0:
                    severity = CliffSeverity.MEDIUM
                else:
                    severity = CliffSeverity.LOW

                window_start = max(0.0, ts_start - 5.0)
                window_end = min(duration, ts_start + 10.0)

                current_cliffs.append(
                    CliffPoint(
                        timestamp_start=ts_start,
                        timestamp_end=ts_end,
                        drop_percentage=round(drop_pct, 1),
                        severity=severity,
                        retention_before=round(ret_before, 3),
                        retention_after=round(ret_after, 3),
                        position_in_video=position,
                        detection_methods=methods,
                        detection_confidence=confidence,
                        window_start=window_start,
                        window_end=window_end,
                    )
                )

            # Sort by severity and drop percentage
            current_cliffs.sort(key=lambda c: c.drop_percentage, reverse=True)

            # Check self-tuning criteria
            if len(current_cliffs) > cfg.max_cliffs and iterations < 5:
                # Lower sensitivity: increase threshold, increase smoothing
                cfg.severity_threshold *= 1.25
                cfg.min_drop_percentage *= 1.2
                cfg.smoothing_sigma *= 1.1
            elif len(current_cliffs) < cfg.min_cliffs and iterations < 5:
                # Raise sensitivity: decrease threshold, decrease smoothing
                cfg.severity_threshold *= 0.8
                cfg.min_drop_percentage = max(5.0, cfg.min_drop_percentage * 0.8)
                cfg.smoothing_sigma = max(1.0, cfg.smoothing_sigma * 0.9)
            else:
                final_cliffs = current_cliffs[:cfg.max_cliffs]
                break

            final_cliffs = current_cliffs[:cfg.max_cliffs]

        logger.info("[%s] Detection completed: %d cliffs confirmed after %d iterations.",
                    self.name, len(final_cliffs), iterations)

        return DetectionResult(
            cliffs=final_cliffs,
            config_used=cfg,
            iterations_needed=iterations,
            total_candidates_before_filter=total_candidates,
        )


mathematician_agent = MathematicianAgent()
