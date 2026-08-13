import logging
from prefect import task
from wormcat3 import Wormcat
from wormcat3.constants import PAdjustMethod
from wormcat3.file_util import zip_dir

from app.services.analysis_service import ensure_float
from app.utils.email_utility import email_error_results, email_results
from app.utils.file_utility import WORMCAT_OUT_PATH, get_upload_dir_path

logger = logging.getLogger("wormcat3.tasks.email")


@task(name="execute_batch_and_email")
def execute_batch_and_email_task(enrichment_request: dict) -> None:
    wormcat = Wormcat(
        working_dir_path=WORMCAT_OUT_PATH,
        title=enrichment_request["title"],
        annotation_file_name=enrichment_request["annotation_file_name"],
        email=enrichment_request["email"],
    )

    input_file_path = f"{get_upload_dir_path()}/{enrichment_request['gene_set']}"
    wormcat.wormcat_batch(
        input_data=input_file_path,
        background_input=enrichment_request["background_genes"],
        p_adjust_method=PAdjustMethod.from_str(enrichment_request["p_adjust_method"]),
        p_adjust_threshold=ensure_float(enrichment_request["p_adjust_threshold"]),
    )

    output_zip_path = zip_dir(wormcat.working_dir_path)
    email_results(enrichment_request["email"], output_zip_path)


@task(name="send_error_email")
def send_error_email_task(email: str, run_number: str, error_message: str) -> None:
    email_error_results(email, run_number, error_message)
