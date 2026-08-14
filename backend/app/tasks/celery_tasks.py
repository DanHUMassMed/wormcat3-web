import logging
import shutil
from pathlib import Path
from typing import Any, Dict

from wormcat3 import Wormcat
from wormcat3.constants import PAdjustMethod
from wormcat3.file_util import zip_dir

from app.core.celery_app import celery_app
from app.schemas.progress_models import ProgressEvent, ProgressState
from app.services.analysis_service import (
    EnrichmentAnalysisEngine,
    GSEAEngine,
    ensure_float,
)
from app.services.progress_publisher import progress_publisher
from app.utils.email_utility import email_error_results, email_results
from app.utils.file_utility import WORMCAT_OUT_PATH, get_upload_dir_path

logger = logging.getLogger("wormcat3.tasks.celery")


@celery_app.task(bind=True, name="wormcat.run_and_wait")
def run_and_wait_task(self, enrichment_request: Dict[str, Any], task_id: str) -> Dict[str, Any]:
    percent_complete = 10
    logger.info("Starting run_and_wait_task for task_id: %s", task_id)

    try:
        wormcat_base = Wormcat(
            working_dir_path=WORMCAT_OUT_PATH,
            annotation_file_name=enrichment_request["annotation_file_name"],
            title=enrichment_request["title"],
        )
        working_dir_path = wormcat_base.working_dir_path

        progress_publisher.publish(
            ProgressEvent(
                task_id=task_id,
                state=ProgressState.PROGRESS,
                progress=percent_complete,
                message="Extracting Excel files",
            )
        )

        csv_file_path = EnrichmentAnalysisEngine.extract_excel_sheets(
            enrichment_request["gene_set"], working_dir_path
        )
        csv_files = list(csv_file_path.glob("*.csv"))

        increment = int(round(80 / len(csv_files), 0)) if csv_files else 80

        for file_path in csv_files:
            percent_complete += increment
            progress_publisher.publish(
                ProgressEvent(
                    task_id=task_id,
                    state=ProgressState.PROGRESS,
                    progress=min(percent_complete, 95),
                    message=f"Processing {file_path.stem} sheet",
                )
            )

            EnrichmentAnalysisEngine.analyze_single_sheet(
                working_dir_path=working_dir_path,
                annotation_file_name=enrichment_request["annotation_file_name"],
                sheet_file=file_path,
                background_genes=enrichment_request.get("background_genes"),
                p_adjust_method=enrichment_request["p_adjust_method"],
                p_adjust_threshold=enrichment_request["p_adjust_threshold"],
            )

        progress_publisher.publish(
            ProgressEvent(
                task_id=task_id,
                state=ProgressState.PROGRESS,
                progress=100,
                message="Summarizing Analysis Results",
            )
        )

        zip_file_name = EnrichmentAnalysisEngine.build_summary_workbook(wormcat_base)

        progress_publisher.publish(
            ProgressEvent(
                task_id=task_id,
                state=ProgressState.COMPLETED,
                progress=100,
                message="Analysis completed successfully",
                result_url=zip_file_name,
                report_id=task_id,
                download_url=f"/dynamic/wormcat_out/{zip_file_name}",
            )
        )
        logger.info("Successfully completed run_and_wait_task for task_id: %s", task_id)
        return {"status": "completed", "result_url": zip_file_name}

    except Exception as e:
        logger.error("run_and_wait_task failed for task %s: %s", task_id, e, exc_info=True)
        progress_publisher.publish(
            ProgressEvent(
                task_id=task_id,
                state=ProgressState.FAILED,
                progress=percent_complete,
                message=f"ERROR: Processing Enrichment| [{e}]",
                error_details=str(e),
            )
        )
        return {"status": "failed", "error": str(e)}


@celery_app.task(bind=True, name="wormcat.run_gsea_and_wait")
def run_gsea_and_wait_task(self, gsea_request: Dict[str, Any], task_id: str) -> Dict[str, Any]:
    percent_complete = 15
    logger.info("Starting run_gsea_and_wait_task for task_id: %s", task_id)

    try:
        gsea_file_path = f"{get_upload_dir_path()}/{gsea_request['gene_set']}"
        wormcat_base = Wormcat(
            working_dir_path=WORMCAT_OUT_PATH,
            annotation_file_name=gsea_request["annotation_file_name"],
            title=gsea_request["title"],
        )

        clean_df, analyzer = GSEAEngine.prepare_input(
            gsea_file_path, wormcat_base.working_dir_path, wormcat_base.run_number
        )
        ranked_list_df = analyzer.create_ranked_list(clean_df)

        progress_publisher.publish(
            ProgressEvent(
                task_id=task_id,
                state=ProgressState.PROGRESS,
                progress=percent_complete,
                message="Creating ranked list",
            )
        )

        first_3_ids = ranked_list_df["Gene"].head(3).tolist()
        gene_type = wormcat_base.annotation_manager.get_gene_id_type(first_3_ids)

        increment = 25
        for category in [1, 2, 3]:
            percent_complete += increment
            progress_publisher.publish(
                ProgressEvent(
                    task_id=task_id,
                    state=ProgressState.PROGRESS,
                    progress=min(percent_complete, 90),
                    message=f"Processing Category {category} sheet",
                )
            )

            GSEAEngine.run_category_analysis(
                analyzer=analyzer,
                ranked_list_df=ranked_list_df,
                category=category,
                gene_type=gene_type,
                annotation_file_name=gsea_request["annotation_file_name"],
                working_dir_path=wormcat_base.working_dir_path,
                run_number=wormcat_base.run_number,
            )

        progress_publisher.publish(
            ProgressEvent(
                task_id=task_id,
                state=ProgressState.PROGRESS,
                progress=95,
                message="Summarizing Analysis Results",
            )
        )

        # 1. Zip output directory for downloads
        output_zip_path = zip_dir(wormcat_base.working_dir_path)
        zip_file_name = Path(output_zip_path).name

        # 2. Clean up category subdirectories in preview working dir
        work_path = Path(wormcat_base.working_dir_path)
        for item in work_path.iterdir():
            if item.is_dir():
                shutil.rmtree(item)

        progress_publisher.publish(
            ProgressEvent(
                task_id=task_id,
                state=ProgressState.COMPLETED,
                progress=100,
                message="GSEA completed successfully",
                result_url=zip_file_name,
                report_id=wormcat_base.run_number,
                download_url=f"/dynamic/wormcat_out/{zip_file_name}",
            )
        )
        logger.info("Successfully completed run_gsea_and_wait_task for task_id: %s", task_id)
        return {"status": "completed", "result_url": zip_file_name, "report_id": wormcat_base.run_number}

    except Exception as e:
        logger.error("run_gsea_and_wait_task failed for task %s: %s", task_id, e, exc_info=True)
        progress_publisher.publish(
            ProgressEvent(
                task_id=task_id,
                state=ProgressState.FAILED,
                progress=percent_complete,
                message=f"ERROR: Failed running GSEA| [{e}]",
                error_details=str(e),
            )
        )
        return {"status": "failed", "error": str(e)}


@celery_app.task(bind=True, name="wormcat.run_and_email")
def run_and_email_task(self, enrichment_request: Dict[str, Any], task_id: str) -> Dict[str, Any]:
    logger.info("Starting run_and_email_task for task_id: %s", task_id)
    try:
        wormcat = Wormcat(
            working_dir_path=WORMCAT_OUT_PATH,
            title=enrichment_request["title"],
            annotation_file_name=enrichment_request["annotation_file_name"],
            email=enrichment_request["email"],
        )

        input_file_path = f"{get_upload_dir_path()}/{enrichment_request['gene_set']}"
        wormcat.wormcat_batch(
            input_data=input_file_path,
            background_input=enrichment_request.get("background_genes"),
            p_adjust_method=PAdjustMethod.from_str(enrichment_request["p_adjust_method"]),
            p_adjust_threshold=ensure_float(enrichment_request["p_adjust_threshold"]),
        )

        output_zip_path = zip_dir(wormcat.working_dir_path)
        email_results(enrichment_request["email"], output_zip_path)
        logger.info("Successfully sent results email for task_id: %s", task_id)
        return {"status": "completed"}
    except Exception as e:
        logger.error("run_and_email_task error for task %s: %s", task_id, e, exc_info=True)
        email = enrichment_request.get("email")
        if email:
            run_number = task_id[:8]
            email_error_results(email, run_number, str(e))
        return {"status": "failed", "error": str(e)}
