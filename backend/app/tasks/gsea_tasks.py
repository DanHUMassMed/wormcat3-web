import logging
import shutil
from pathlib import Path
from typing import Any, Dict, List
from prefect import task
from wormcat3 import Wormcat
from wormcat3.file_util import zip_dir
from wormcat3.gsea_analyzer import GSEAAnalyzer

from app.services.analysis_service import GSEAEngine
from app.utils.file_utility import WORMCAT_OUT_PATH, get_upload_dir_path

logger = logging.getLogger("wormcat3.tasks.gsea")


@task(name="init_gsea_analysis")
def init_gsea_analysis_task(gsea_request: dict) -> Dict[str, Any]:
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

    first_3_ids = ranked_list_df["Gene"].head(3).tolist()
    gene_type = wormcat_base.annotation_manager.get_gene_id_type(first_3_ids)

    return {
        "working_dir_path": wormcat_base.working_dir_path,
        "run_number": wormcat_base.run_number,
        "gene_type": gene_type,
        "ranked_list_dict": ranked_list_df.to_dict(orient="records"),
        "annotation_file_name": gsea_request["annotation_file_name"],
        "title": gsea_request["title"],
    }


@task(name="run_gsea_category")
def run_gsea_category_task(
    working_dir_path: str,
    run_number: str,
    gene_type: str,
    ranked_list_dict: List[Dict[str, Any]],
    annotation_file_name: str,
    title: str,
    category: int,
) -> int:
    import pandas as pd

    ranked_list_df = pd.DataFrame(ranked_list_dict)
    analyzer = GSEAAnalyzer(working_dir_path)
    GSEAEngine.run_category_analysis(
        analyzer=analyzer,
        ranked_list_df=ranked_list_df,
        category=category,
        gene_type=gene_type,
        annotation_file_name=annotation_file_name,
        working_dir_path=working_dir_path,
        run_number=run_number,
    )
    return category


@task(name="finalize_gsea")
def finalize_gsea_task(working_dir_path: str) -> str:
    # 1. Zip output folder containing CSV files and category detail subdirectories for the download archive
    output_zip_path = zip_dir(working_dir_path)

    # 2. Clean up category subdirectories from preview directory so it only contains CSV files
    work_path = Path(working_dir_path)
    for item in work_path.iterdir():
        if item.is_dir():
            shutil.rmtree(item)

    return Path(output_zip_path).name
