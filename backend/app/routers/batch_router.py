import os
from fastapi import APIRouter, HTTPException, BackgroundTasks,UploadFile, File, Form, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from pydantic import ValidationError
from datetime import datetime
from typing import Optional, Dict, Any, Union
import uuid
import json
from pathlib import Path
import redis
import asyncio
from app.schemas.enrichment_models import EnrichmentRequest, EnrichmentResponse
from app.tasks.celery_tasks import run_and_email_task, run_and_wait_task
from app.utils.file_utility import get_upload_dir_path

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


@router.post("/run-and-email")
async def run_and_email(request: Request):
    print("run_and_email called")
    try:
        raw_body = await request.body()
        parsed_body = json.loads(raw_body)
        print(parsed_body)
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
        print(f"before run_and_email_task.apply_async")
        run_and_email_task.apply_async(kwargs={"enrichment_request": enrichment_request.model_dump(),"task_id":task_id})
        print(f"after run_and_email_task.apply_async")
        return EnrichmentResponse(run_id=task_id)
    except Exception as e:
        print("run_and_email failed!!")
        print(str(e))
        raise HTTPException(status_code=500, detail=str(e))
    
        
@router.post("/run-and-wait")
async def run_and_wait(request: Request):
    task_id = str(uuid.uuid4())
    #TODO update to wormcat batch process
    run_and_wait_task.apply_async(args=[task_id])
    print(f"task_id: {task_id}")
    return {"task_id": task_id}

@router.websocket("/ws/{task_id}")
async def websocket_endpoint(websocket: WebSocket, task_id: str):
    await websocket.accept()
    pubsub = redis_client.pubsub()
    channel = f"task:{task_id}"
    pubsub.subscribe(channel)

    try:
        while True:
            message = pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
            print(f"message: {message}")
            if message:
                data = json.loads(message["data"])
                await websocket.send_json(data)
                if data.get("state") == "COMPLETED":
                    break
            await asyncio.sleep(0.1)  # Yield control to the event loop
    finally:
        pubsub.unsubscribe(channel)
        await websocket.close()
        
        
