import logging
from typing import Dict
from prefect import flow

from app.schemas.progress_models import ProgressEvent, ProgressState
from app.services.progress import progress_bus
from app.tasks.gsea_tasks import (
    finalize_gsea_task,
    init_gsea_analysis_task,
    run_gsea_category_task,
)

logger = logging.getLogger("wormcat3.flows.gsea")


@flow(name="run_gsea_flow", description="Executes GSEA analysis and publishes progress events")
def run_gsea_flow(gsea_request: dict, task_id: str) -> Dict[str, str]:
    percent_complete = 15

    try:
        init_data = init_gsea_analysis_task(gsea_request)
        working_dir_path = init_data["working_dir_path"]
        run_number = init_data["run_number"]
        gene_type = init_data["gene_type"]
        ranked_list_dict = init_data["ranked_list_dict"]

        progress_bus.publish_sync(
            ProgressEvent(
                task_id=task_id,
                state=ProgressState.PROGRESS,
                progress=percent_complete,
                message="Creating ranked list",
            )
        )

        increment = 25
        for category in [1, 2, 3]:
            percent_complete += increment
            progress_bus.publish_sync(
                ProgressEvent(
                    task_id=task_id,
                    state=ProgressState.PROGRESS,
                    progress=min(percent_complete, 90),
                    message=f"Processing Category {category} sheet",
                )
            )

            run_gsea_category_task(
                working_dir_path=working_dir_path,
                run_number=run_number,
                gene_type=gene_type,
                ranked_list_dict=ranked_list_dict,
                annotation_file_name=gsea_request["annotation_file_name"],
                title=gsea_request["title"],
                category=category,
            )

        progress_bus.publish_sync(
            ProgressEvent(
                task_id=task_id,
                state=ProgressState.PROGRESS,
                progress=95,
                message="Summarizing Analysis Results",
            )
        )

        zip_file_name = finalize_gsea_task(working_dir_path)

        progress_bus.publish_sync(
            ProgressEvent(
                task_id=task_id,
                state=ProgressState.COMPLETED,
                progress=100,
                message="GSEA completed successfully",
                result_url=zip_file_name,
            )
        )
        return {"status": "completed", "result_url": zip_file_name}

    except Exception as e:
        logger.error("run_gsea_flow error for task %s: %s", task_id, e, exc_info=True)
        progress_bus.publish_sync(
            ProgressEvent(
                task_id=task_id,
                state=ProgressState.FAILED,
                progress=percent_complete,
                message=f"ERROR: GSEA execution failed| [{e}]",
                error_details=str(e),
            )
        )
        return {"status": "failed", "error": str(e)}
