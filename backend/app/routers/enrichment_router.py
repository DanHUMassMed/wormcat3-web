import os
from fastapi import APIRouter, HTTPException, Request
from pydantic import ValidationError
from app.schemas.enrichment_models import EnrichmentRequest, EnrichmentResponse
from wormcat3 import Wormcat
from wormcat3.constants import PAdjustMethod
from wormcat3.file_util import zip_dir
from typing import Any
import json
from app.utils.file_utility import WORMCAT_OUT_PATH

router = APIRouter()

@router.post("/analyze_and_visualize_enrichment", response_model=EnrichmentResponse)
async def analyze_and_visualize_enrichment(request: Request):
    # Note: Automatically parsing the request into a pydantic model 
    # produces obscure and difficult to interpret errors on failure
    # Manually parsing is far more transparent and easier to debug
    try:
        raw_body = await request.body()
        parsed_body = json.loads(raw_body)
        print(parsed_body)
        enrichment_request = EnrichmentRequest(**parsed_body)
    except json.JSONDecodeError as e:
        return EnrichmentResponse(
            status_code="400",
            message=f"Invalid JSON format: {str(e)}",
            run_id=""
        )
    except ValidationError as e:
        error_messages = "; ".join(
            [f"{'.'.join(str(loc) for loc in err['loc'])}: {err['msg']}" for err in e.errors()]
        )
        return EnrichmentResponse(
            status_code="422",
            message=f"Validation error: {error_messages}",
            run_id=""
        )
    
    try:
        wormcat = Wormcat(working_dir_path=WORMCAT_OUT_PATH, 
                          title=enrichment_request.title, 
                          annotation_file_name=enrichment_request.annotation_file_name, 
                          email=enrichment_request.email)
        wormcat.analyze_and_visualize_enrichment(
            gene_set_input = enrichment_request.gene_set,
            background_input = enrichment_request.background,
            p_adjust_method = PAdjustMethod.from_str(enrichment_request.p_adjust_method),
            p_adjust_threshold = enrichment_request.p_adjust_threshold
        )
        zip_dir(wormcat.working_dir_path)
        ret_val = EnrichmentResponse(run_id = wormcat.run_number)
        return ret_val

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))