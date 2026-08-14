import time
from enum import Enum
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ProgressState(str, Enum):
    PENDING = "PENDING"
    PROGRESS = "PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class ProgressEvent(BaseModel):
    task_id: str
    state: ProgressState
    progress: int = Field(default=0, ge=0, le=100)
    message: str
    result_url: Optional[str] = None
    report_id: Optional[str] = None
    download_url: Optional[str] = None
    error_details: Optional[str] = None
    timestamp: float = Field(default_factory=time.time)

    def to_ws_message(self) -> Dict[str, Any]:
        data: Dict[str, Any] = {
            "task_id": self.task_id,
            "state": self.state.value,
            "progress": self.progress,
            "message": self.message,
            "timestamp": self.timestamp,
        }
        if self.result_url:
            data["result_url"] = self.result_url
        if self.report_id:
            data["report_id"] = self.report_id
        if self.download_url:
            data["download_url"] = self.download_url
        if self.error_details:
            data["error_details"] = self.error_details
        return data


class TaskStatusResponse(BaseModel):
    task_id: str
    state: ProgressState
    progress: int
    message: str
    result_url: Optional[str] = None
    report_id: Optional[str] = None
    download_url: Optional[str] = None
    error_details: Optional[str] = None
    timestamp: float
