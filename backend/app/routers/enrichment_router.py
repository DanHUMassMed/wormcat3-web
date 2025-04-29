import os
from fastapi import APIRouter, HTTPException
from app.schemas.enrichment_models import EnrichmentRequest, EnrichmentResponse
from wormcat3 import Wormcat
from wormcat3.constants import PAdjustMethod

router = APIRouter()


@router.post("/analyze_and_visualize_enrichment", response_model=EnrichmentResponse)
def analyze_and_visualize_enrichment(payload: EnrichmentRequest):
    try:
        wormcat_out_path = os.environ.get("WORMCAT_OUT_PATH")
        wormcat = Wormcat(working_dir_path=wormcat_out_path, 
                          title=payload.title, 
                          annotation_file_name=payload.annotation_file_name, 
                          email=payload.email)
        wormcat.analyze_and_visualize_enrichment(
            gene_set_input = payload.gene_set,
            background_input = payload.background,
            p_adjust_method = PAdjustMethod.from_str(payload.p_adjust_method),
            p_adjust_threshold = payload.p_adjust_threshold
        )

        return EnrichmentResponse(
            working_dir_path = wormcat_out_path,
            run_id = wormcat.run_number
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))