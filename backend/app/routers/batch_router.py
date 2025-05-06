# Pydantic models for request validation
from fastapi import APIRouter, HTTPException, BackgroundTasks,UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any, Union
import uuid
from pathlib import Path

import os

#from app.utils.email_utility import send_async_email, online_progress

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


WORMCAT_OUT_PATH="/Users/dan/Code/Python/wormcat3-web/frontend/public"
UPLOAD_DIR = Path(WORMCAT_OUT_PATH)/ "dynamic/uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/upload_excel/")
async def upload_excel(file: UploadFile = File(...)):
    job_id = str(uuid.uuid4())
    job_path = UPLOAD_DIR / job_id
    job_path.mkdir(parents=True, exist_ok=True)
    
    file_location = job_path / file.filename
    with open(file_location, "wb") as f:
        f.write(await file.read())

    return {"job_id": job_id}




# @router.post("/api/batch_process")
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