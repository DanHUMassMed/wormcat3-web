import logging
from pathlib import Path
from typing import Dict
from prefect import flow

from app.schemas.progress_models import ProgressEvent, ProgressState
from app.services.progress import progress_bus
from app.tasks.enrichment_tasks import (
    analyze_single_sheet_task,
    extract_excel_sheets_task,
    generate_summary_excel_task,
    initialize_wormcat_task,
)

logger = logging.getLogger("wormcat3.flows.enrichment")


@flow(name="run_and_wait_flow", description="Executes enrichment analysis and publishes progress events")
def run_and_wait_flow(enrichment_request: dict, task_id: str) -> Dict[str, str]:
    percent_complete = 10

    try:
        init_data = initialize_wormcat_task(
            annotation_file_name=enrichment_request["annotation_file_name"],
            title=enrichment_request["title"],
        )
        working_dir_path = init_data["working_dir_path"]
        annotation_file_path = init_data["annotation_file_path"]

        progress_bus.publish_sync(
            ProgressEvent(
                task_id=task_id,
                state=ProgressState.PROGRESS,
                progress=percent_complete,
                message="Extracting Excel files",
            )
        )

        csv_files = extract_excel_sheets_task(
            gene_set_filename=enrichment_request["gene_set"],
            working_dir_path=working_dir_path,
        )

        increment = int(round(80 / len(csv_files), 0)) if csv_files else 80

        for file_path in csv_files:
            file_stem = Path(file_path).stem
            percent_complete += increment
            progress_bus.publish_sync(
                ProgressEvent(
                    task_id=task_id,
                    state=ProgressState.PROGRESS,
                    progress=min(percent_complete, 95),
                    message=f"Processing {file_stem} sheet",
                )
            )

            analyze_single_sheet_task(
                working_dir_path=working_dir_path,
                annotation_file_name=enrichment_request["annotation_file_name"],
                sheet_file_path=file_path,
                background_genes=enrichment_request["background_genes"],
                p_adjust_method=enrichment_request["p_adjust_method"],
                p_adjust_threshold=enrichment_request["p_adjust_threshold"],
            )

        progress_bus.publish_sync(
            ProgressEvent(
                task_id=task_id,
                state=ProgressState.PROGRESS,
                progress=100,
                message="Summarizing Analysis Results",
            )
        )

        zip_file_name = generate_summary_excel_task(
            working_dir_path=working_dir_path,
            annotation_file_path=annotation_file_path,
        )

        progress_bus.publish_sync(
            ProgressEvent(
                task_id=task_id,
                state=ProgressState.COMPLETED,
                progress=100,
                message="Analysis completed successfully",
                result_url=zip_file_name,
            )
        )
        return {"status": "completed", "result_url": zip_file_name}

    except Exception as e:
        logger.error("run_and_wait_flow error for task %s: %s", task_id, e, exc_info=True)
        progress_bus.publish_sync(
            ProgressEvent(
                task_id=task_id,
                state=ProgressState.FAILED,
                progress=percent_complete,
                message=f"ERROR: Analysis pipeline failed| [{e}]",
                error_details=str(e),
            )
        )
        return {"status": "failed", "error": str(e)}
