import logging
from pathlib import Path
from typing import Any, Dict, List
from prefect import task
from wormcat3 import Wormcat
from wormcat3.file_util import zip_dir

from app.services.analysis_service import (
    EnrichmentAnalysisEngine,
)
from app.utils.file_utility import WORMCAT_OUT_PATH

logger = logging.getLogger("wormcat3.tasks.enrichment")


@task(name="initialize_wormcat")
def initialize_wormcat_task(annotation_file_name: str, title: str) -> Dict[str, Any]:
    wormcat_base = Wormcat(
        working_dir_path=WORMCAT_OUT_PATH,
        annotation_file_name=annotation_file_name,
        title=title,
    )
    return {
        "working_dir_path": wormcat_base.working_dir_path,
        "run_number": wormcat_base.run_number,
        "annotation_file_path": wormcat_base.annotation_manager.annotation_file_path,
    }


@task(name="extract_excel_sheets")
def extract_excel_sheets_task(gene_set_filename: str, working_dir_path: str) -> List[str]:
    csv_file_path = EnrichmentAnalysisEngine.extract_excel_sheets(
        gene_set_filename, working_dir_path
    )
    csv_files = list(csv_file_path.glob("*.csv"))
    return [str(f) for f in csv_files]


@task(name="analyze_single_sheet")
def analyze_single_sheet_task(
    working_dir_path: str,
    annotation_file_name: str,
    sheet_file_path: str,
    background_genes: Any,
    p_adjust_method: str,
    p_adjust_threshold: float,
) -> str:
    sheet_path = Path(sheet_file_path)
    EnrichmentAnalysisEngine.analyze_single_sheet(
        working_dir_path,
        annotation_file_name,
        sheet_path,
        background_genes,
        p_adjust_method,
        p_adjust_threshold,
    )
    return sheet_path.stem


@task(name="generate_summary_excel")
def generate_summary_excel_task(working_dir_path: str, annotation_file_path: str) -> str:
    summary_excel_path = f"{working_dir_path}/{Path(working_dir_path).stem}.xlsx"
    from wormcat3.wormcat_excel import WormcatExcel

    wormcat_excel = WormcatExcel()
    wormcat_excel.create_summary_spreadsheet(
        working_dir_path, annotation_file_path, summary_excel_path
    )
    output_zip_path = zip_dir(working_dir_path)
    return Path(output_zip_path).name
