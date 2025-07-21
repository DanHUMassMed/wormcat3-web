from pydantic import BaseModel
from typing import List, Optional, Union
from wormcat3.constants import PAdjustMethod, DEFAULT_ANNOTATION_FILE_NAME, DEFAULT_TITLE, DEFAULT_P_ADJUST_THRESHOLD

class EnrichmentRequest(BaseModel):
    gene_set: Union[str, List[str]]
    title: str = DEFAULT_TITLE
    email: str = None
    annotation_file_name: str = DEFAULT_ANNOTATION_FILE_NAME
    background_genes: Optional[Union[str, List[str]]] = None
    p_adjust_method: str = PAdjustMethod.BONFERRONI.value
    p_adjust_threshold: float = DEFAULT_P_ADJUST_THRESHOLD


class EnrichmentResponse(BaseModel):
    status_code: str = "200"
    message: str = "Success"
    run_id: str
    
    
    