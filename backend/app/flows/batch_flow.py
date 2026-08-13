import logging
from typing import Dict
from prefect import flow

from app.tasks.email_tasks import execute_batch_and_email_task, send_error_email_task

logger = logging.getLogger("wormcat3.flows.batch")


@flow(name="run_and_email_flow", description="Executes batch analysis and emails results")
def run_and_email_flow(enrichment_request: dict, task_id: str) -> Dict[str, str]:
    try:
        execute_batch_and_email_task(enrichment_request)
        return {"status": "completed"}
    except Exception as e:
        logger.error("run_and_email_flow failed for task %s: %s", task_id, e, exc_info=True)
        email = enrichment_request.get("email")
        if email:
            send_error_email_task(
                email=email,
                run_number=task_id[:8],
                error_message=str(e),
            )
        return {"status": "failed", "error": str(e)}
