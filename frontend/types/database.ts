export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface YouTubeChannel {
  id: string;
  user_id: string;
  channel_id: string;
  channel_name: string;
  channel_thumbnail: string | null;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  connected_at: string;
}

// 6-phase pipeline statuses matching backend src/models/state.py
export type AnalysisStatus =
  | "PENDING"
  | "FETCHING_DATA"
  | "DETECTING_CLIFFS"
  | "INVESTIGATING"
  | "DEBATING"
  | "SYNTHESIZING_REPORT"
  | "COMPLETE"
  | "ERROR";

export interface AnalysisRecord {
  id: string;
  user_id: string;
  channel_id: string | null;
  video_id: string;
  video_title: string;
  status: AnalysisStatus;
  report_data: ForensicReport | Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageRecord {
  id: string;
  analysis_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// --- API DTO Models (matching backend src/models/api.py) ---

export interface AnalysisRequest {
  video_id: string;
}

export interface AnalysisResponse {
  analysis_id: string;
  status: string;
  message: string;
}

export interface AgentMessagePayload {
  sender: string;
  recipient: string;
  content: string;
  message_type: string;
  data?: Record<string, any>;
  timestamp: string;
}

export interface InvestigationPlanPayload {
  video_id: string;
  total_cliffs: number;
  cliff_ids: string[];
  priority_order: string[];
  strategy: string;
  required_confidence: number;
  rationale: string;
}

export interface AnalysisStatusResponse {
  analysis_id: string;
  status: string;
  progress_percentage: number;
  current_phase: string;
  active_agents: string[];
  debate_rounds: number;
  error_message: string | null;
  agent_messages?: AgentMessagePayload[];
  investigation_plan?: InvestigationPlanPayload | null;
  telemetry?: Record<string, any>;
}

export interface ReportListItem {
  analysis_id: string;
  video_id: string;
  video_title: string;
  status: string;
  overall_health_score: number | null;
  grade: string | null;
  created_at: string;
}

export interface VideoListItem {
  video_id: string;
  title: string;
  thumbnail_url: string;
  published_at: string;
  view_count: number;
  duration: string;
}

export interface ChatRequest {
  analysis_id: string;
  message: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export interface YouTubeAuthResponse {
  auth_url: string;
}

export interface SystemStatus {
  api_version: string;
  system: string;
  subsystems: Record<string, string>;
  agents: Record<string, string>;
}

// --- Domain Models (matching backend src/models/domain.py) ---

export type CliffSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface VideoMetadata {
  video_id: string;
  title: string;
  description: string;
  channel_id: string;
  channel_name: string;
  duration_seconds: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  published_at: string;
  thumbnail_url: string;
}

export interface RetentionDataPoint {
  time_ratio: number;
  watch_ratio: number;
  timestamp_seconds: number;
}

export interface RetentionData {
  video_id: string;
  data_points: RetentionDataPoint[];
  average_retention: number;
  total_duration_seconds: number;
  quality_score: number;
  anomaly_flags: string[];
}

export interface CliffPoint {
  timestamp_start: number;
  timestamp_end: number;
  drop_percentage: number;
  severity: CliffSeverity;
  retention_before: number;
  retention_after: number;
  position_in_video: "early" | "middle" | "late" | string;
  detection_methods: string[];
  detection_confidence: number;
  window_start?: number;
  window_end?: number;
}

export interface Evidence {
  source_agent: string;
  tool_name?: string;
  description: string;
  confidence: number;
  data_reference?: Record<string, unknown>;
  supports_hypothesis: boolean;
}

export interface InvestigationPass {
  pass_number: number;
  agent_name: string;
  hypothesis: string;
  tools_used: string[];
  evidence_gathered: Evidence[];
  conclusion: string;
  confidence: number;
}

export interface CliffAnalysis {
  cliff: CliffPoint;
  investigation_passes?: InvestigationPass[];
  evidence_chain: Evidence[];
  root_cause: string;
  visual_analysis: string;
  audio_analysis: string;
  pacing_analysis: string;
  content_analysis: string;
  confidence_score: number;
  critic_approved: boolean;
  recommendations: string[];
}

export interface HealthScore {
  overall: number;
  grade: string;
  content_score: number;
  pacing_score: number;
  audio_score: number;
  visual_score: number;
  hook_score: number;
}

export interface ActionItem {
  priority: "P0" | "P1" | "P2" | string;
  category: "VISUAL" | "AUDIO" | "PACING" | "SCRIPT" | "HOOK" | string;
  description: string;
  expected_impact: string;
  related_cliff_timestamp: string | null;
}

export interface MethodologyNote {
  agents_involved: string[];
  total_debate_rounds: number;
  average_confidence: number;
  caveats: string;
}

export interface ForensicReport {
  report_id: string;
  video: VideoMetadata;
  health_score: HealthScore;
  executive_summary: string;
  cliff_reports: CliffAnalysis[];
  action_items: ActionItem[];
  positive_highlights: string[];
  methodology: MethodologyNote;
  generated_at: string;
}
