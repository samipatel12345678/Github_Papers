"""Core data models for multi-agent system with single shared history."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional
import datetime
import uuid


class MessageRole(str, Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"


class AgentRole(str, Enum):
    COORDINATOR = "Coordinator"
    ARCHITECT = "Architect"
    CODER = "Coder"
    REVIEWER = "Reviewer"
    TESTER = "Tester"
    HUMAN = "Human"


@dataclass
class ToolCall:
    id: str
    name: str
    arguments: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "arguments": self.arguments
        }


@dataclass
class ToolResult:
    tool_call_id: str
    name: str
    output: str
    success: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tool_call_id": self.tool_call_id,
            "name": self.name,
            "output": self.output,
            "success": self.success
        }


@dataclass
class HistoryEntry:
    """A single immutable step in the unified shared history.
    
    All agents read from and append to this canonical chronological stream.
    """
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    step_number: int = 0
    timestamp: str = field(
        default_factory=lambda: datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    sender_name: str = "System"
    sender_role: AgentRole = AgentRole.COORDINATOR
    message_role: MessageRole = MessageRole.ASSISTANT
    thought: Optional[str] = None
    content: str = ""
    tool_calls: List[ToolCall] = field(default_factory=list)
    tool_results: List[ToolResult] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "step_number": self.step_number,
            "timestamp": self.timestamp,
            "sender_name": self.sender_name,
            "sender_role": self.sender_role.value if isinstance(self.sender_role, AgentRole) else str(self.sender_role),
            "message_role": self.message_role.value if isinstance(self.message_role, MessageRole) else str(self.message_role),
            "thought": self.thought,
            "content": self.content,
            "tool_calls": [tc.to_dict() for tc in self.tool_calls],
            "tool_results": [tr.to_dict() for tr in self.tool_results],
            "metadata": self.metadata
        }
