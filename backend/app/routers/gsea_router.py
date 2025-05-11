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

router = APIRouter()

@router.post("/perform_gsea_analysis", response_model=GSEAResponse)
async def perform_gsea_analysis(request: Request):
    try:
        raw_body = await request.body()
        parsed_body = json.loads(raw_body)
        print(parsed_body)
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
        wormcat_out_path = os.environ.get("WORMCAT_OUT_PATH")
        upload_dir = (Path(wormcat_out_path) / "../uploads").resolve()
        wormcat = Wormcat(working_dir_path=wormcat_out_path, 
                          title=gsea_request.title, 
                          annotation_file_name=gsea_request.annotation_file_name, 
                          email=gsea_request.email)
        
        input_file_path=f"{upload_dir}/{gsea_request.gene_set}"
        wormcat.perform_gsea_analysis(input_file_path)
        zip_dir(wormcat.working_dir_path)
        ret_val = GSEAResponse(run_id = wormcat.run_number)
        return ret_val

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))