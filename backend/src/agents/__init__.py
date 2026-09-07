from src.agents.archivist import ArchivistAgent, archivist_agent
from src.agents.executive_editor import ExecutiveEditorAgent, executive_editor_agent
from src.agents.mathematician import MathematicianAgent, mathematician_agent
from src.agents.orchestrator import PipelineOrchestrator, pipeline_orchestrator
from src.agents.skeptic import SkepticAgent, skeptic_agent
from src.agents.sound_engineer import SoundEngineerAgent, sound_engineer_agent
from src.agents.studio_advisor import StudioAdvisorAgent, studio_advisor_agent
from src.agents.supervisor import SupervisorAgent, supervisor_agent
from src.agents.visual_detective import VisualDetectiveAgent, visual_detective_agent

__all__ = [
    "supervisor_agent",
    "SupervisorAgent",
    "archivist_agent",
    "ArchivistAgent",
    "mathematician_agent",
    "MathematicianAgent",
    "visual_detective_agent",
    "VisualDetectiveAgent",
    "sound_engineer_agent",
    "SoundEngineerAgent",
    "skeptic_agent",
    "SkepticAgent",
    "executive_editor_agent",
    "ExecutiveEditorAgent",
    "studio_advisor_agent",
    "StudioAdvisorAgent",
    "pipeline_orchestrator",
    "PipelineOrchestrator",
]
