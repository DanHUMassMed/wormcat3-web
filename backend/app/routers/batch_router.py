import asyncio
import inspect
import json
import logging
import os
import uuid
from typing import Optional

import redis
from app.schemas.enrichment_models import EnrichmentRequest, EnrichmentResponse
from app.tasks.celery_tasks import run_and_email_task, run_and_wait_task
from app.utils.file_utility import get_upload_dir_path, log_users
from fastapi import (APIRouter, File, HTTPException, Request, UploadFile,WebSocket)
from pydantic import BaseModel, ValidationError

logger = logging.getLogger()
logger.setLevel(os.getenv("LOG_LEVEL", "WARNING").upper())

router = APIRouter()
redis_client = redis.Redis(host='localhost', port=6379, db=0)


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
    with open(file_location, "wb") as f:
        f.write(await file.read())

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
            message=f"Invalid JSON format: {str(e)}",)
    except ValidationError as e:
        error_messages = "; ".join(
            [f"{'.'.join(str(loc) for loc in err['loc'])}: {err['msg']}" for err in e.errors()]
        )
        return EnrichmentResponse(
            status_code="422",
            message=f"Validation error: {error_messages}",
        )
    
    try:
        task_id = str(uuid.uuid4())
        run_and_email_task.apply_async(kwargs={"enrichment_request": enrichment_request.model_dump(),"task_id":task_id})
        return EnrichmentResponse(run_id=task_id)
    except Exception as e:
        logger.error("run_and_email failed!!")
        logger.error(str(e))
        return EnrichmentResponse(
            status_code="500",
            message=f"Dispatch error: {str(e)}",
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
        )
    except ValidationError as e:
        error_messages = "; ".join(
            [f"{'.'.join(str(loc) for loc in err['loc'])}: {err['msg']}" for err in e.errors()]
        )
        return EnrichmentResponse(
            status_code="422",
            message=f"Validation error: {error_messages}",
        )
    
    try:
        task_id = str(uuid.uuid4())
        run_and_wait_task.apply_async(kwargs={"enrichment_request": enrichment_request.model_dump(),"task_id":task_id})
        return EnrichmentResponse(run_id=task_id)
    except Exception as e:
        logger.error("run_and_email failed!!")
        logger.error(str(e))
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    await websocket.accept()
    pubsub = redis_client.pubsub()
    channel = f"task:{task_id}"
    pubsub.subscribe(channel)

    try:
        while True:
            message = pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            if message:
                data = json.loads(message["data"])
                await websocket.send_json(data)
                if data.get("state") == "COMPLETED":
                    break
                if data.get("state") == "FAILED":
                    break
            await asyncio.sleep(0.1)  # Yield control to the event loop
    finally:
        pubsub.unsubscribe(channel)
        await websocket.close()
        
        
