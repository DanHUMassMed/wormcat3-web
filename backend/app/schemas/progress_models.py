from enum import Enum
from typing import Optional
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
    error_details: Optional[str] = None

    def to_ws_message(self) -> dict:
        data = {
            "state": self.state.value,
            "progress": self.progress,
            "message": self.message,
        }
        if self.result_url:
            data["result_url"] = self.result_url
        if self.error_details:
            data["error_details"] = self.error_details
        return data
