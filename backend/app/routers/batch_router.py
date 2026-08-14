import asyncio
import inspect
import json
import logging
import os
import shutil
import uuid
from typing import Optional

from fastapi import (
    APIRouter,
    File,
    HTTPException,
    Request,
    UploadFile,
    WebSocket,
    WebSocketDisconnect,
)
from pydantic import BaseModel, ValidationError

from app.core.redis import (
    get_async_redis_client,
    get_task_event_channel,
)
from app.schemas.enrichment_models import EnrichmentRequest, EnrichmentResponse
from app.schemas.progress_models import ProgressEvent, ProgressState, TaskStatusResponse
from app.services.progress_publisher import RedisProgressPublisher
from app.tasks.celery_tasks import run_and_email_task, run_and_wait_task
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
        run_and_email_task.apply_async(
            kwargs={
                "enrichment_request": enrichment_request.model_dump(),
                "task_id": task_id,
            }
        )
        return EnrichmentResponse(run_id=task_id)
    except Exception as e:
        logger.error("run_and_email dispatch failed: %s", str(e))
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
        # Record initial PENDING state in Redis
        initial_event = ProgressEvent(
            task_id=task_id,
            state=ProgressState.PENDING,
            progress=0,
            message="Task queued",
        )
        await RedisProgressPublisher.publish_async(initial_event)

        run_and_wait_task.apply_async(
            kwargs={
                "enrichment_request": enrichment_request.model_dump(),
                "task_id": task_id,
            }
        )
        return EnrichmentResponse(run_id=task_id)
    except Exception as e:
        logger.error("run_and_wait dispatch failed: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    state = await RedisProgressPublisher.get_state_async(task_id)
    if state is None:
        raise HTTPException(status_code=404, detail="Task not found or status expired")
    return TaskStatusResponse(
        task_id=state.task_id,
        state=state.state,
        progress=state.progress,
        message=state.message,
        result_url=state.result_url,
        report_id=state.report_id,
        download_url=state.download_url,
        error_details=state.error_details,
        timestamp=state.timestamp,
    )


@router.websocket("/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    await websocket.accept()
    redis_client = get_async_redis_client()
    channel = get_task_event_channel(task_id)
    pubsub = redis_client.pubsub()

    try:
        # 1. Replay cached state if already present (handles reconnects and fast completions)
        current_state = await RedisProgressPublisher.get_state_async(task_id, async_client=redis_client)
        if current_state:
            await websocket.send_json(current_state.to_ws_message())
            if current_state.state in (ProgressState.COMPLETED, ProgressState.FAILED):
                await websocket.close()
                return

        # 2. Subscribe to live Redis Pub/Sub channel
        await pubsub.subscribe(channel)

        while True:
            # Non-blocking listen on async Redis pubsub
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message and message.get("data"):
                data = json.loads(message["data"])
                await websocket.send_json(data)
                if data.get("state") in (ProgressState.COMPLETED.value, ProgressState.FAILED.value):
                    break
            await asyncio.sleep(0.05)

    except WebSocketDisconnect:
        logger.debug("WebSocket disconnected by client for task %s", task_id)
    except Exception as e:
        logger.error("WebSocket error for task %s: %s", task_id, e)
    finally:
        try:
            await pubsub.unsubscribe(channel)
            await pubsub.close()
        except Exception:
            pass
        try:
            await websocket.close()
        except Exception:
            pass
