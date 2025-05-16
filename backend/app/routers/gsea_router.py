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
        wormcat = Wormcat(working_dir_path=WORMCAT_OUT_PATH, 
                          title=gsea_request.title, 
                          annotation_file_name=gsea_request.annotation_file_name, 
                          email=gsea_request.email)
        
        input_file_path=f"{get_upload_dir_path()}/{gsea_request.gene_set}"
        wormcat.perform_gsea_analysis(input_file_path)
        zip_dir(wormcat.working_dir_path)
        ret_val = GSEAResponse(run_id = wormcat.run_number)
        return ret_val

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))