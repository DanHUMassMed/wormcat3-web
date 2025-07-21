import inspect
import json
import logging
import os
import uuid

from app.schemas.gsea_models import GSEARequest, GSEAResponse
from app.tasks.celery_tasks import run_gsea_and_wait_task
from app.utils.file_utility import (log_users)
from fastapi import APIRouter, HTTPException, Request
from pydantic import ValidationError

logger = logging.getLogger()
logger.setLevel(os.getenv("WORMCAT_LOG_LEVEL", "WARNING").upper())


router = APIRouter()

@router.post("/perform_gsea_analysis", response_model=GSEAResponse)
async def perform_gsea_analysis(request: Request):
    method_name = inspect.currentframe().f_code.co_name
    # Note: Automatically parsing the request into a pydantic model 
    # produces obscure and difficult to interpret errors on failure
    # Manually parsing is far more transparent and easier to debug
    try:
        raw_body = await request.body()
        parsed_body = json.loads(raw_body)
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
        logger.error("run_and_email failed!!")
        logger.error(str(e))
        raise HTTPException(status_code=500, detail=str(e))
