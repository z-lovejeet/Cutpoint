"""
Pipeline Orchestrator for Cutpoint.
Coordinates the end-to-end execution of all 8 autonomous agents,
manages blackboard state transitions, live polling progress, and Supabase persistence.
"""
import logging
from typing import Dict, Optional

from src.agents.archivist import archivist_agent
from src.agents.executive_editor import executive_editor_agent
from src.agents.mathematician import mathematician_agent
from src.agents.supervisor import supervisor_agent
from src.models.domain import ForensicReport
from src.models.state import AgentMessage, AnalysisState, AnalysisStatus
from src.services.supabase_service import supabase_service

logger = logging.getLogger(__name__)


class PipelineOrchestrator:
    """Orchestrates the multi-agent retention analysis pipeline lifecycle."""

    def __init__(self):
        # In-memory blackboard state dictionary for real-time stepper polling
        self.active_states: Dict[str, AnalysisState] = {}

    def get_state(self, analysis_id: str) -> Optional[AnalysisState]:
        """Retrieves active live state by analysis ID."""
        return self.active_states.get(analysis_id)

    def initialize_state(self, analysis_id: str, video_id: str) -> AnalysisState:
        """Initializes a new tracking state on the blackboard."""
        state = AnalysisState(
            analysis_id=analysis_id,
            video_id=video_id,
            status=AnalysisStatus.PENDING,
            current_phase="Pipeline initialized. Dispatching Data Ingestion Agent...",
            progress_percentage=5,
            active_agents=[archivist_agent.name],
        )
        self.active_states[analysis_id] = state
        return state

    async def run_analysis(
        self,
        analysis_id: str,
        video_id: str,
        user_id: str,
    ) -> ForensicReport:
        """
        Executes the complete 6-phase autonomous multi-agent forensic pipeline.
        """
        logger.info("[Pipeline] Starting analysis run %s for video %s (user %s)...",
                    analysis_id, video_id, user_id)

        # Retrieve or initialize live state
        state = self.active_states.get(analysis_id) or self.initialize_state(analysis_id, video_id)

        try:
            # -------------------------------------------------------------
            # Phase 1: Data Ingestion (The Archivist)
            # -------------------------------------------------------------
            state.status = AnalysisStatus.FETCHING_DATA
            state.current_phase = "Pulling video metadata and second-by-second retention curve..."
            state.progress_percentage = 15
            state.active_agents = [archivist_agent.name]
            self._sync_db_status(analysis_id, "FETCHING_DATA")

            ingestion_result = await archivist_agent.ingest(video_id=video_id, user_id=user_id)
            metadata = ingestion_result.metadata
            retention_data = ingestion_result.retention

            if not metadata or not retention_data:
                raise RuntimeError(f"Ingestion failed: {ingestion_result.quality_report}")

            state.agent_messages.append(
                AgentMessage(
                    sender="The Archivist",
                    recipient="Supervisor",
                    content=f"Ingested {len(retention_data.data_points)} second-by-second retention data points for '{metadata.title}' ({int(metadata.duration_seconds//60)}m {int(metadata.duration_seconds%60)}s).",
                    message_type="info",
                    data={
                        "title": metadata.title,
                        "duration_seconds": metadata.duration_seconds,
                        "data_points": len(retention_data.data_points),
                        "average_retention": retention_data.average_retention,
                    },
                )
            )

            # -------------------------------------------------------------
            # Phase 2: Mathematical Cliff Detection (The Mathematician)
            # -------------------------------------------------------------
            state.status = AnalysisStatus.DETECTING_CLIFFS
            state.current_phase = "Running signal processing calculus & ensemble cliff detection..."
            state.progress_percentage = 30
            state.active_agents = [mathematician_agent.name]
            self._sync_db_status(analysis_id, "DETECTING_CLIFFS")

            detection_result = mathematician_agent.detect_cliffs(retention_data)
            cliffs_count = len(detection_result.cliffs)
            logger.info("[Pipeline] Discovered %d candidate drop cliffs.", cliffs_count)

            cliff_chips = [
                f"{int(c.timestamp_start//60):02d}:{int(c.timestamp_start%60):02d} (-{c.drop_percentage:.1f}%)"
                for c in detection_result.cliffs
            ]
            state.agent_messages.append(
                AgentMessage(
                    sender="The Mathematician",
                    recipient="Supervisor",
                    content=f"Signal calculus identified {cliffs_count} critical drop cliffs: {', '.join(cliff_chips) if cliff_chips else 'None'}.",
                    message_type="finding",
                    data={
                        "cliffs_count": cliffs_count,
                        "cliffs": cliff_chips,
                        "iterations": detection_result.iterations_needed,
                    },
                )
            )

            # -------------------------------------------------------------
            # Phase 3 & 4: Investigation & Debate (Supervisor, Visual, Sound, Skeptic)
            # -------------------------------------------------------------
            state.status = AnalysisStatus.INVESTIGATING
            state.current_phase = "Multimodal visual and acoustic inspection with adversarial debate..."
            state.progress_percentage = 35
            state.active_agents = [supervisor_agent.name]
            # Map to database ENUM 'ANALYZING_VIDEO'
            self._sync_db_status(analysis_id, "ANALYZING_VIDEO")

            verified_analyses = await supervisor_agent.run_investigation(
                detection_result=detection_result,
                metadata=metadata,
                retention_data=retention_data,
                state=state,
            )

            # -------------------------------------------------------------
            # Phase 5: Synthesis & Report Generation (The Executive Editor)
            # -------------------------------------------------------------
            state.status = AnalysisStatus.GENERATING_REPORT
            state.current_phase = "The Executive Editor: Computing 5-pillar health score & ranking action plan..."
            state.progress_percentage = 85
            state.active_agents = [executive_editor_agent.name]
            self._sync_db_status(analysis_id, "GENERATING_REPORT")

            report = await executive_editor_agent.synthesize_report(
                metadata=metadata,
                verified_findings=verified_analyses,
                cliffs=detection_result.cliffs,
                analysis_id=analysis_id,
            )

            state.agent_messages.append(
                AgentMessage(
                    sender="The Executive Editor",
                    recipient="Lead Investigator",
                    content=f"Forensic report synthesized: Overall Health Score {report.health_score.overall:.1f} ({report.health_score.grade}) with {len(report.action_items)} action items.",
                    message_type="approval",
                    data={
                        "overall_score": report.health_score.overall,
                        "grade": report.health_score.grade,
                        "action_items_count": len(report.action_items),
                    },
                )
            )

            # -------------------------------------------------------------
            # Phase 6: Completion & Database Persistence
            # -------------------------------------------------------------
            state.status = AnalysisStatus.COMPLETE
            state.current_phase = f"Forensic audit finalized • Health Score {report.health_score.overall:.1f} ({report.health_score.grade})"
            state.progress_percentage = 100
            state.active_agents = []

            # Persist finalized report JSON to Supabase
            report_dict = report.model_dump()
            self._sync_db_status(analysis_id, "COMPLETE", video_title=metadata.title, report_data=report_dict)

            logger.info("[Pipeline] Analysis %s completed successfully with Health Score %.1f!",
                        analysis_id, report.health_score.overall)
            return report

        except Exception as e:
            logger.error("[Pipeline] Analysis run %s failed: %s", analysis_id, e, exc_info=True)
            state.status = AnalysisStatus.ERROR
            state.current_phase = "Analysis encountered an error."
            state.error_message = str(e)
            self._sync_db_status(analysis_id, "ERROR", error_message=str(e))
            raise

    def _sync_db_status(
        self,
        analysis_id: str,
        status: str,
        video_title: Optional[str] = None,
        report_data: Optional[Dict] = None,
        error_message: Optional[str] = None,
    ):
        """Helper to push status updates to the Supabase database."""
        try:
            supabase_service.update_analysis_status(
                analysis_id=analysis_id,
                status=status,
                video_title=video_title,
                report_data=report_data,
                error_message=error_message,
            )
        except Exception as e:
            logger.warning("[Pipeline] DB sync warning for %s: %s", analysis_id, e)


pipeline_orchestrator = PipelineOrchestrator()
