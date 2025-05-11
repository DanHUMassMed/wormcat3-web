from pydantic import BaseModel
from wormcat3.constants import DEFAULT_ANNOTATION_FILE_NAME


class GSEARequest(BaseModel):
    gene_set: str
    title: str = "GSEA"
    email: str
    annotation_file_name: str = DEFAULT_ANNOTATION_FILE_NAME


class GSEAResponse(BaseModel):
    status_code: str = "200"
    message: str = "Success"
    run_id: str
    
    
    