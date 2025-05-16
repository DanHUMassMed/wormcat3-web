import os
from fastapi import APIRouter, HTTPException,Request
from pydantic import ValidationError
from app.schemas.gsea_models import GSEARequest, GSEAResponse
from wormcat3 import Wormcat
from wormcat3.constants import PAdjustMethod
from wormcat3.file_util import zip_dir
from typing import Any
import json
from pathlib import Path
from app.utils.file_utility import WORMCAT_OUT_PATH, get_upload_dir_path,log_users
from app.tasks.celery_tasks import run_gsea_and_wait_task
import uuid
import inspect


router = APIRouter()

@router.post("/perform_gsea_analysis", response_model=GSEAResponse)
async def perform_gsea_analysis(request: Request):
    method_name = inspect.currentframe().f_code.co_name
    print(f"{method_name} called")
    # Note: Automatically parsing the request into a pydantic model 
    # produces obscure and difficult to interpret errors on failure
    # Manually parsing is far more transparent and easier to debug
    try:
        raw_body = await request.body()
        parsed_body = json.loads(raw_body)
        print(parsed_body)
        log_users(method_name, parsed_body)
        gsea_request = GSEARequest(**parsed_body)
    except json.JSONDecodeError as e:
        return GSEAResponse(
            status_code="400",
            message=f"Invalid JSON format: {str(e)}",
            run_id=""
        )
    except ValidationError as e:
        error_messages = "; ".join(
            [f"{'.'.join(str(loc) for loc in err['loc'])}: {err['msg']}" for err in e.errors()]
        )
        return GSEAResponse(
            status_code="422",
            message=f"Validation error: {error_messages}",
            run_id=""
        )
    
    
    try:
        task_id = str(uuid.uuid4())
        run_gsea_and_wait_task.apply_async(kwargs={"gsea_request": gsea_request.model_dump(),"task_id":task_id})
        return GSEAResponse(run_id=task_id)
    except Exception as e:
        print("run_and_email failed!!")
        print(str(e))
        raise HTTPException(status_code=500, detail=str(e))
