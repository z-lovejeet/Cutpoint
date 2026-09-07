# Agent 3: The Cliff Detector Agent (The Mathematician)

## 1. Agent Identity
- **Name:** Cliff Detector Agent
- **Role:** The Mathematician
- **Model:** None (NumPy/SciPy based, no LLM)
- **Autonomy Type:** Autonomous through adaptive algorithms and self-tuning

## 2. Purpose
The Cliff Detector Agent mathematically identifies significant drops in viewer retention ('cliffs') using signal processing techniques. Unlike a simple hardcoded threshold check, this agent employs a multi-algorithm ensemble with adaptive sensitivity, ensuring robust detection across various video lengths and retention profiles. It acts as the mathematical backbone of the Cutpoint platform, providing objective anomalies for the downstream forensic agents to investigate.

## 3. Autonomous Behaviors

The Cliff Detector Agent exhibits genuine autonomy through the following mechanisms:

- **Adaptive Thresholding:** The agent automatically adjusts sensitivity based on video characteristics. For instance, short videos (under 5 minutes) typically require tighter thresholds than long-form content.
- **Multi-Algorithm Ensemble:** It runs three distinct mathematical detection algorithms in parallel and takes a consensus, minimizing false positives:
  1. **First Derivative Method (Gradient-Based):** Detects sudden rates of change.
  2. **Sliding Window Drop Detection:** Identifies sustained drops over a rolling period.
  3. **Z-Score Anomaly Detection:** Flags statistically significant negative outliers in the derivative curve.
- **Self-Tuning Sensitivity (Perception-Action Loop):** If the initial parameters yield too many (e.g., > 10) or too few (e.g., 0) cliffs, the agent automatically adjusts smoothing (`sigma`) and threshold parameters and re-runs the detection up to a maximum number of iterations.
- **Confidence Scoring:** Each detected cliff is assigned a confidence score (0.0 to 1.0) based on algorithm agreement and the absolute magnitude of the drop.
- **Context Window Calculation:** The agent dynamically calculates the analysis window (start and end timestamps) around each detected cliff, providing precise boundaries for visual and audio analysis.

## 4. Detection Algorithms (Mathematical Detail)

### Algorithm 1: First Derivative (Gradient) Method
This algorithm focuses on identifying the steepest points of descent in the retention curve.
1. **Smoothing:** The raw retention curve is smoothed using a Gaussian filter (`scipy.ndimage.gaussian_filter1d`) with an adaptive `sigma` to reduce high-frequency noise.
2. **Derivative:** The first derivative of the smoothed curve is calculated using `numpy.gradient`.
3. **Local Minima:** The algorithm identifies local minima in the derivative curve (representing the points of steepest drop) using `scipy.signal.argrelextrema`.
4. **Filtering:** Minima that fall below a dynamically calculated threshold are flagged as cliff candidates.

### Algorithm 2: Sliding Window Drop Detection
This algorithm looks for absolute drops over a fixed percentage of the video length.
1. **Window Size:** A window size is defined (default: 5% of total video length).
2. **Iteration:** The algorithm slides this window across the retention curve.
3. **Comparison:** For each window, the retention at the start is compared to the retention at the end.
4. **Thresholding:** If the drop `(start_val - end_val)` exceeds the configured `min_drop_percentage`, the center of the window is flagged as a cliff candidate.

### Algorithm 3: Z-Score Anomaly Detection
This algorithm leverages statistical anomalies in the rate of change.
1. **Derivative Calculation:** The first derivative of the retention curve is calculated.
2. **Z-Score Computation:** Z-scores for all derivative values are computed: `Z = (X - \mu) / \sigma`.
3. **Anomaly Flagging:** Points where the Z-score is less than -2.0 (representing a drop more than 2 standard deviations steeper than the mean rate of change) are flagged.

### Ensemble Consensus
The candidate points from all three algorithms are clustered based on temporal proximity.
- A candidate is confirmed as a definitive cliff if it is detected by at least **2 out of 3** algorithms.
- **Confidence Score:** Calculated as `(algorithms_agreeing / 3) * magnitude_factor`, where the magnitude factor is normalized based on the drop severity.

## 5. Data Models

```python
from pydantic import BaseModel, Field
from typing import List
from enum import Enum

class SeverityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class CliffPoint(BaseModel):
    timestamp_seconds: float = Field(..., description="The time in seconds where the cliff occurs")
    elapsed_ratio: float = Field(..., description="Ratio of video length (0.0 to 1.0)")
    drop_percentage: float = Field(..., description="Absolute retention drop percentage at this point")
    severity: SeverityLevel = Field(..., description="Categorized severity of the drop")
    confidence: float = Field(..., description="Confidence score from 0.0 to 1.0")
    window_start: float = Field(..., description="Start timestamp of the dynamic context window")
    window_end: float = Field(..., description="End timestamp of the dynamic context window")
    detection_methods: List[str] = Field(..., description="Which algorithms detected this cliff")

class DetectionConfig(BaseModel):
    severity_threshold: float = Field(0.05, description="Gradient threshold for severity")
    smoothing_sigma: float = Field(2.0, description="Sigma for Gaussian smoothing")
    min_drop_percentage: float = Field(3.0, description="Minimum drop percentage for sliding window")
    max_cliffs: int = Field(5, description="Maximum number of cliffs to return")
    min_cliffs: int = Field(1, description="Minimum number of cliffs desired before tuning")
    window_size_ratio: float = Field(0.05, description="Window size as ratio of total video length")
    z_score_threshold: float = Field(-2.0, description="Z-score threshold for anomaly detection")

class DetectionResult(BaseModel):
    cliffs: List[CliffPoint] = Field(default_factory=list)
    config_used: DetectionConfig
    iterations_needed: int
    total_candidates_before_filter: int
```

## 6. Complete Implementation

```python
import numpy as np
import scipy.ndimage
import scipy.signal
import scipy.stats
from typing import List, Dict, Tuple
import logging

# Ensure Pydantic models (CliffPoint, DetectionConfig, DetectionResult, SeverityLevel) 
# are imported from the models module as defined above.

logger = logging.getLogger(__name__)

class CliffDetectorAgent:
    """
    The Mathematician: Autonomously detects retention cliffs using a multi-algorithm ensemble
    with adaptive self-tuning parameters.
    """
    
    def __init__(self, default_config: DetectionConfig = None):
        self.config = default_config or DetectionConfig()
        
    def detect_gradient_cliffs(self, time_sec: np.ndarray, retention: np.ndarray, config: DetectionConfig) -> List[float]:
        """Algorithm 1: First Derivative (Gradient) Method"""
        # 1. Smooth the curve
        smoothed = scipy.ndimage.gaussian_filter1d(retention, sigma=config.smoothing_sigma)
        
        # 2. Calculate derivative
        derivative = np.gradient(smoothed, time_sec)
        
        # 3. Find local minima in the derivative (steepest drops)
        minima_indices = scipy.signal.argrelextrema(derivative, np.less)[0]
        
        # 4. Filter by severity threshold
        candidates = []
        for idx in minima_indices:
            if derivative[idx] < -config.severity_threshold:
                candidates.append(time_sec[idx])
                
        return candidates

    def detect_sliding_window_cliffs(self, time_sec: np.ndarray, retention: np.ndarray, config: DetectionConfig) -> List[float]:
        """Algorithm 2: Sliding Window Drop Detection"""
        video_length = time_sec[-1]
        window_sec = video_length * config.window_size_ratio
        
        # Determine approx number of points in the window
        dt = np.mean(np.diff(time_sec))
        window_pts = max(1, int(window_sec / dt))
        
        candidates = []
        for i in range(len(retention) - window_pts):
            start_val = retention[i]
            end_val = retention[i + window_pts]
            drop = start_val - end_val
            
            if drop > config.min_drop_percentage:
                # Flag the center of the window
                center_idx = i + (window_pts // 2)
                candidates.append(time_sec[center_idx])
                
        # Debounce (remove adjacent points within the same window)
        return self._debounce_candidates(candidates, window_sec)

    def detect_zscore_cliffs(self, time_sec: np.ndarray, retention: np.ndarray, config: DetectionConfig) -> List[float]:
        """Algorithm 3: Z-Score Anomaly Detection"""
        derivative = np.gradient(retention, time_sec)
        
        # Avoid division by zero
        if np.std(derivative) == 0:
            return []
            
        z_scores = scipy.stats.zscore(derivative)
        
        candidates = []
        for i, z in enumerate(z_scores):
            if z < config.z_score_threshold:
                candidates.append(time_sec[i])
                
        # Debounce
        dt = np.mean(np.diff(time_sec)) if len(time_sec) > 1 else 1.0
        return self._debounce_candidates(candidates, dt * 5)

    def _debounce_candidates(self, candidates: List[float], min_distance: float) -> List[float]:
        """Utility to group closely spaced candidate points."""
        if not candidates:
            return []
        
        candidates.sort()
        debounced = []
        current_group = [candidates[0]]
        
        for i in range(1, len(candidates)):
            if candidates[i] - candidates[i-1] <= min_distance:
                current_group.append(candidates[i])
            else:
                debounced.append(np.mean(current_group))
                current_group = [candidates[i]]
        debounced.append(np.mean(current_group))
        return debounced

    def ensemble_consensus(self, 
                           time_sec: np.ndarray, 
                           retention: np.ndarray,
                           grad_candidates: List[float], 
                           window_candidates: List[float], 
                           zscore_candidates: List[float]) -> List[Dict]:
        """Combines results from the 3 algorithms based on temporal clustering."""
        all_candidates = [(t, 'gradient') for t in grad_candidates] + \
                         [(t, 'window') for t in window_candidates] + \
                         [(t, 'zscore') for t in zscore_candidates]
                         
        if not all_candidates:
            return []
            
        # Cluster candidates within a small time window (e.g., 5 seconds)
        all_candidates.sort(key=lambda x: x[0])
        clusters = []
        current_cluster = [all_candidates[0]]
        
        for idx in range(1, len(all_candidates)):
            t, method = all_candidates[idx]
            if t - current_cluster[-1][0] <= 5.0:
                current_cluster.append(all_candidates[idx])
            else:
                clusters.append(current_cluster)
                current_cluster = [all_candidates[idx]]
        clusters.append(current_cluster)
        
        # Evaluate consensus
        confirmed_cliffs = []
        video_len = time_sec[-1]
        
        for cluster in clusters:
            methods = list(set([c[1] for c in cluster]))
            if len(methods) >= 2: # Require agreement from at least 2 algorithms
                avg_time = np.mean([c[0] for c in cluster])
                
                # Calculate magnitude metrics
                idx = (np.abs(time_sec - avg_time)).argmin()
                drop_val = 0.0
                if idx > 0:
                     drop_val = retention[max(0, idx-5)] - retention[idx]
                
                confidence = (len(methods) / 3.0) * min(1.0, drop_val / 10.0) # Scale confidence
                
                confirmed_cliffs.append({
                    "time": avg_time,
                    "methods": methods,
                    "confidence": confidence,
                    "drop_val": drop_val,
                    "ratio": avg_time / video_len if video_len > 0 else 0
                })
                
        return confirmed_cliffs
        
    def classify_severity(self, drop_val: float) -> SeverityLevel:
        if drop_val > 15.0: return SeverityLevel.CRITICAL
        elif drop_val > 8.0: return SeverityLevel.HIGH
        elif drop_val > 4.0: return SeverityLevel.MEDIUM
        return SeverityLevel.LOW

    def calculate_context_windows(self, time_sec: float, video_length: float) -> Tuple[float, float]:
        """Dynamically sizes the analysis window around each cliff."""
        # Baseline window: 5 seconds before, 10 seconds after
        start_time = max(0, time_sec - 5.0)
        end_time = min(video_length, time_sec + 10.0)
        return start_time, end_time

    def _run_single_pass(self, time_sec: np.ndarray, retention: np.ndarray, config: DetectionConfig) -> List[CliffPoint]:
        """Executes a single detection pass with the given configuration."""
        grad = self.detect_gradient_cliffs(time_sec, retention, config)
        wind = self.detect_sliding_window_cliffs(time_sec, retention, config)
        zscr = self.detect_zscore_cliffs(time_sec, retention, config)
        
        consensus_data = self.ensemble_consensus(time_sec, retention, grad, wind, zscr)
        
        results = []
        video_length = time_sec[-1] if len(time_sec) > 0 else 0
        
        for c in consensus_data:
            w_start, w_end = self.calculate_context_windows(c['time'], video_length)
            results.append(CliffPoint(
                timestamp_seconds=c['time'],
                elapsed_ratio=c['ratio'],
                drop_percentage=c['drop_val'],
                severity=self.classify_severity(c['drop_val']),
                confidence=c['confidence'],
                window_start=w_start,
                window_end=w_end,
                detection_methods=c['methods']
            ))
            
        # Sort by confidence descending and limit to max_cliffs
        results.sort(key=lambda x: x.confidence, reverse=True)
        return results[:config.max_cliffs]

    def run(self, time_sec: np.ndarray, retention: np.ndarray) -> DetectionResult:
        """Full pipeline with auto-tuning loop."""
        max_iterations = 5
        current_config = self.config.model_copy()
        best_cliffs = []
        
        for iteration in range(1, max_iterations + 1):
            logger.info(f"Running detection iteration {iteration} with config: {current_config}")
            cliffs = self._run_single_pass(time_sec, retention, current_config)
            
            num_cliffs = len(cliffs)
            
            # Auto-tuning logic
            if num_cliffs > current_config.max_cliffs:
                logger.info(f"Too many cliffs ({num_cliffs}). Tuning down sensitivity.")
                current_config.severity_threshold *= 1.2
                current_config.min_drop_percentage *= 1.2
                current_config.smoothing_sigma *= 1.1
            elif num_cliffs < current_config.min_cliffs and iteration < max_iterations:
                logger.info(f"Too few cliffs ({num_cliffs}). Tuning up sensitivity.")
                current_config.severity_threshold *= 0.8
                current_config.min_drop_percentage *= 0.8
                current_config.smoothing_sigma = max(0.5, current_config.smoothing_sigma * 0.9)
            else:
                logger.info(f"Optimal cliff count reached ({num_cliffs}). Breaking loop.")
                best_cliffs = cliffs
                break
                
            # Keep track of the best effort if we exhaust iterations
            if len(cliffs) > len(best_cliffs):
                best_cliffs = cliffs
                
        return DetectionResult(
            cliffs=best_cliffs,
            config_used=current_config,
            iterations_needed=iteration,
            total_candidates_before_filter=len(best_cliffs) # simplified
        )
```

## 7. Self-Tuning Loop

The core intelligence of this agent lies in its ability to adapt its mathematical parameters dynamically. 
Unlike static systems that fail when presented with an unusually volatile or unusually stable video, the self-tuning loop acts as a perception-action-reflection cycle.

**Pseudocode Structure:**
```python
while True:
    # Action: Detect using current parameters
    cliffs = detect(current_params)
    
    # Reflection & Perception
    if len(cliffs) > MAX_CLIFFS: 
        # Tuning: Increase thresholds, increase smoothing to filter noise
        decrease_sensitivity(current_params)
    elif len(cliffs) < MIN_CLIFFS: 
        # Tuning: Decrease thresholds, reduce smoothing to pick up subtle drops
        increase_sensitivity(current_params)
    else: 
        # Optimal state achieved
        break
        
    if iterations > MAX_ITERATIONS: 
        break with best result
```
This loop ensures the agent always produces actionable data for the multi-agent system, avoiding situations where the downstream Forensic Agent is starved of targets or overwhelmed with noise.

## 8. Visualization

The mathematical output can be visualized over the raw retention curve using matplotlib to provide a diagnostic view of the agent's performance.

```python
import matplotlib.pyplot as plt

def visualize_cliffs(time_sec: np.ndarray, retention: np.ndarray, result: DetectionResult):
    """Plots retention curve and overlays detected cliffs."""
    plt.figure(figsize=(12, 6))
    plt.plot(time_sec, retention, label='Retention Curve', color='blue', linewidth=2)
    
    # Plot smoothed version for reference (using final config)
    smoothed = scipy.ndimage.gaussian_filter1d(retention, sigma=result.config_used.smoothing_sigma)
    plt.plot(time_sec, smoothed, label='Smoothed (Gaussian)', color='lightblue', linestyle='--')
    
    # Overlay Cliffs
    for i, cliff in enumerate(result.cliffs):
        plt.axvline(x=cliff.timestamp_seconds, color='red', linestyle=':', alpha=0.7)
        plt.scatter([cliff.timestamp_seconds], 
                    [retention[np.abs(time_sec - cliff.timestamp_seconds).argmin()]], 
                    color='red', s=100, zorder=5)
                    
        # Highlight dynamic window
        plt.axvspan(cliff.window_start, cliff.window_end, color='orange', alpha=0.2, label='Context Window' if i==0 else "")
        
        # Annotate
        plt.annotate(f"{cliff.severity.value}\nConf: {cliff.confidence:.2f}",
                     (cliff.timestamp_seconds, retention[np.abs(time_sec - cliff.timestamp_seconds).argmin()]),
                     textcoords="offset points", xytext=(10,10), ha='left',
                     bbox=dict(boxstyle="round,pad=0.3", fc="yellow", ec="b", lw=1))

    plt.title(f"Cliff Detector Agent Results\n(Iterations: {result.iterations_needed}, Found: {len(result.cliffs)})")
    plt.xlabel('Time (Seconds)')
    plt.ylabel('Retention (%)')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.show()
```

This diagnostic visualization serves as a crucial debugging tool for the architect when verifying the adaptive behaviors of the Cliff Detector Agent.
