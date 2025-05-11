# Pydantic models for request validation
from fastapi import APIRouter, HTTPException, BackgroundTasks,UploadFile, File, Form, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any, Union
import uuid
import json
from pathlib import Path
import redis
import asyncio
from app.tasks import long_task,long_running_task

import os

#from app.utils.email_utility import send_async_email, online_progress

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


WORMCAT_OUT_PATH = os.environ.get("WORMCAT_OUT_PATH")
if not WORMCAT_OUT_PATH:
    raise EnvironmentError("WORMCAT_OUT_PATH environment variable is not set.")

UPLOAD_DIR = (Path(WORMCAT_OUT_PATH) / "../uploads").resolve()
print(UPLOAD_DIR)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload_file")
async def upload_file(file: UploadFile = File(...)):
    job_id = str(uuid.uuid4())
    job_path = UPLOAD_DIR / job_id
    job_path.mkdir(parents=True, exist_ok=True)
    
    file_location = job_path / file.filename
    with open(file_location, "wb") as f:
        f.write(await file.read())

    return {"job_id": job_id}



@router.post("/start-task")
async def start_task(request: Request):
    task_id = str(uuid.uuid4())
    long_running_task.apply_async(args=[task_id])
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
        
        
# @router.post("/batch_process")
# async def batch_process(request: BatchProcessRequest):
#     suffix = datetime.now().strftime("%b-%d-%Y-%H_%M_%S")
    
#     params = {
#         'email': request.email,
#         'batch_user': request.batch_user,
#         'annotation_file': request.annotation_file,
#         'xsl_file_nm': request.xsl_file_nm,
#         'suffix': suffix,
#         'redis_channel': None
#     }
    
#     task = send_async_email.delay(params)
#     return {"message": f"Sending email to {request.email}", "task_id": task.id}

# @router.post("/api/longtask", status_code=202)
# async def longtask(request: LongTaskRequest):
#     suffix = datetime.now().strftime("%b-%d-%Y-%H_%M_%S")
    
#     task = online_progress.apply_async()
    
#     params = {
#         'email': None,
#         'batch_user': request.batch_user,
#         'annotation_file': request.annotation_file,
#         'xsl_file_nm': request.xsl_file_nm,
#         'suffix': suffix,
#         'redis_channel': task.id
#     }
    
#     send_async_email.delay(params)
#     return {"task_id": task.id}

# @router.get("/api/status/{task_id}")
# async def taskstatus(task_id: str):
#     task = online_progress.AsyncResult(task_id)
    
#     if task.state == 'PENDING':
#         response = {
#             'state': task.state,
#             'current': 0,
#             'total': 1,
#             'status': 'Pending...'
#         }
#     elif task.state != 'FAILURE':
#         response = {
#             'state': task.state,
#             'current': task.info.get('current', 0),
#             'total': task.info.get('total', 1),
#             'status': task.info.get('status', '')
#         }
#         if 'result' in task.info:
#             response['result'] = task.info['result']
#     else:
#         response = {
#             'state': task.state,
#             'current': 1,
#             'total': 1,
#             'status': str(task.info),
#         }
    
#     return response