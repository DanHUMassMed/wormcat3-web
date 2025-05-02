from pydantic import BaseModel
from typing import List, Optional, Union
from wormcat3.constants import PAdjustMethod


class EnrichmentRequest(BaseModel):
    gene_set: Union[str, List[str]]
    title: str = "Analysis"
    email: str = None
    annotation_file_name: str = "whole_genome_v2_nov-11-2021.csv"
    background: Optional[Union[str, List[str]]] = None
    p_adjust_method: str = PAdjustMethod.BONFERRONI.value
    p_adjust_threshold: float = 0.05


class EnrichmentResponse(BaseModel):
    status_code: str = "200"
    message: str = "Success"
    run_id: str
    
    
    