import asyncio
import inspect
import json
import logging
import os
import shutil
import uuid
from typing import Optional

from fastapi import APIRouter, File, HTTPException, Request, UploadFile, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, ValidationError

from app.flows.batch_flow import run_and_email_flow
from app.flows.enrichment_flow import run_and_wait_flow
from app.schemas.enrichment_models import EnrichmentRequest, EnrichmentResponse
from app.services.progress import progress_bus
from app.utils.file_utility import get_upload_dir_path, log_users

logger = logging.getLogger()
logger.setLevel(os.getenv("WORMCAT_LOG_LEVEL", "WARNING").upper())

router = APIRouter()


class BatchProcessRequest(BaseModel):
    email: str
    batch_user: str
    annotation_file: str
    xsl_file_nm: str


class LongTaskRequest(BaseModel):
    email: Optional[str] = None
    batch_user: str
    annotation_file: str
    xsl_file_nm: str


@router.post("/upload_file")
async def upload_file(file: UploadFile = File(...)):
    job_id = str(uuid.uuid4())
    job_path = get_upload_dir_path() / job_id
    job_path.mkdir(parents=True, exist_ok=True)

    file_location = job_path / file.filename
    with open(file_location, "wb") as destination:
        shutil.copyfileobj(file.file, destination)

    return {"job_id": job_id}


@router.post("/run_and_email")
async def run_and_email(request: Request):
    method_name = inspect.currentframe().f_code.co_name
    try:
        raw_body = await request.body()
        parsed_body = json.loads(raw_body)
        log_users(method_name, parsed_body)
        enrichment_request = EnrichmentRequest(**parsed_body)
    except json.JSONDecodeError as e:
        return EnrichmentResponse(
            status_code="400",
            message=f"Invalid JSON format: {str(e)}",
            run_id="",
        )
    except ValidationError as e:
        error_messages = "; ".join(
            [f"{'.'.join(str(loc) for loc in err['loc'])}: {err['msg']}" for err in e.errors()]
        )
        return EnrichmentResponse(
            status_code="422",
            message=f"Validation error: {error_messages}",
            run_id="",
        )

    try:
        task_id = str(uuid.uuid4())
        asyncio.create_task(
            asyncio.to_thread(
                run_and_email_flow,
                enrichment_request=enrichment_request.model_dump(),
                task_id=task_id,
            )
        )
        return EnrichmentResponse(run_id=task_id)
    except Exception as e:
        logger.error("run_and_email failed: %s", str(e))
        return EnrichmentResponse(
            status_code="500",
            message=f"Dispatch error: {str(e)}",
            run_id="",
        )


@router.post("/run_and_wait")
async def run_and_wait(request: Request):
    method_name = inspect.currentframe().f_code.co_name
    try:
        raw_body = await request.body()
        parsed_body = json.loads(raw_body)
        log_users(method_name, parsed_body)
        enrichment_request = EnrichmentRequest(**parsed_body)
    except json.JSONDecodeError as e:
        return EnrichmentResponse(
            status_code="400",
            message=f"Invalid JSON format: {str(e)}",
            run_id="",
        )
    except ValidationError as e:
        error_messages = "; ".join(
            [f"{'.'.join(str(loc) for loc in err['loc'])}: {err['msg']}" for err in e.errors()]
        )
        return EnrichmentResponse(
            status_code="422",
            message=f"Validation error: {error_messages}",
            run_id="",
        )

    try:
        task_id = str(uuid.uuid4())
        asyncio.create_task(
            asyncio.to_thread(
                run_and_wait_flow,
                enrichment_request=enrichment_request.model_dump(),
                task_id=task_id,
            )
        )
        return EnrichmentResponse(run_id=task_id)
    except Exception as e:
        logger.error("run_and_wait failed: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    await websocket.accept()
    try:
        async for event in progress_bus.subscribe(task_id):
            await websocket.send_json(event.to_ws_message())
    except WebSocketDisconnect:
        logger.debug("WebSocket disconnected for task %s", task_id)
    except Exception as e:
        logger.error("WebSocket error for task %s: %s", task_id, e)
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
