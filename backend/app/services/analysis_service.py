import logging
from pathlib import Path
from typing import Any, Tuple
import pandas as pd

from wormcat3 import AnnotationsManager, Wormcat, file_util
from wormcat3.constants import PAdjustMethod
from wormcat3.file_util import zip_dir
from wormcat3.gsea_analyzer import GSEAAnalyzer
from wormcat3.wormcat_excel import WormcatExcel

from app.utils.file_utility import get_upload_dir_path

logger = logging.getLogger("wormcat3.analysis")


def ensure_float(value: Any) -> float:
    if isinstance(value, float):
        return value
    if isinstance(value, (int, str)):
        try:
            return float(value)
        except ValueError:
            raise ValueError(f"Cannot convert '{value}' to float")
    raise ValueError(f"Value must be numeric or float string, got {type(value).__name__}")


class EnrichmentAnalysisEngine:
    """Service class for encapsulating WormCat enrichment analysis operations."""

    @staticmethod
    def extract_excel_sheets(gene_set_filename: str, working_dir_path: str) -> Path:
        excel_file_path = get_upload_dir_path() / gene_set_filename
        csv_file_name = Path(gene_set_filename)
        csv_file_path = Path(working_dir_path) / f"{csv_file_name.stem}_CSVs"
        WormcatExcel.extract_csv_files(str(excel_file_path), csv_file_path)
        return csv_file_path

    @staticmethod
    def analyze_single_sheet(
        working_dir_path: str,
        annotation_file_name: str,
        sheet_file: Path,
        background_genes: Any,
        p_adjust_method: str,
        p_adjust_threshold: float,
    ) -> None:
        wormcat = Wormcat(
            working_dir_path=working_dir_path,
            annotation_file_name=annotation_file_name,
            title=sheet_file.stem,
        )
        wormcat.analyze_and_visualize_enrichment(
            str(sheet_file),
            background_genes,
            p_adjust_method=PAdjustMethod.from_str(p_adjust_method),
            p_adjust_threshold=ensure_float(p_adjust_threshold),
        )

    @staticmethod
    def build_summary_workbook(wormcat_base: Wormcat) -> str:
        working_dir_path = wormcat_base.working_dir_path
        annotation_file_path = wormcat_base.annotation_manager.annotation_file_path
        summary_excel_path = f"{working_dir_path}/{Path(working_dir_path).stem}.xlsx"
        wormcat_excel = WormcatExcel()
        wormcat_excel.create_summary_spreadsheet(
            working_dir_path, annotation_file_path, summary_excel_path
        )
        output_zip_path = zip_dir(working_dir_path)
        return Path(output_zip_path).name


class GSEAEngine:
    """Service class for encapsulating GSEA analysis operations."""

    @staticmethod
    def prepare_input(
        gsea_file_path: str, working_dir_path: str, run_number: str
    ) -> Tuple[pd.DataFrame, GSEAAnalyzer]:
        deseq2_df = file_util.read_deseq2_file(gsea_file_path)
        analyzer = GSEAAnalyzer(working_dir_path)
        removed_rows_df, clean_df = analyzer.clean_input_data(deseq2_df)

        if not removed_rows_df.empty:
            removed_file_name = f"genes_removed_from_analysis_{run_number}.csv"
            removed_path = Path(working_dir_path) / removed_file_name
            removed_rows_df.to_csv(removed_path, index=False)

        return clean_df, analyzer

    @staticmethod
    def run_category_analysis(
        analyzer: GSEAAnalyzer,
        ranked_list_df: pd.DataFrame,
        category: int,
        gene_type: str,
        annotation_file_name: str,
        working_dir_path: str,
        run_number: str,
    ) -> Path:
        annotation_manager = AnnotationsManager(annotation_file_name)
        gmt_format = annotation_manager.category_to_gmt_format(
            category, id_col_nm=gene_type
        )
        results_name = f"gsea_category_{category}_{run_number}"
        results_df = analyzer.run_preranked_gsea(
            ranked_list_df, gmt_format, results_name, min_size=1
        )
        gsea_category_path = Path(working_dir_path) / f"{results_name}.csv"
        results_df.to_csv(gsea_category_path, index=False)

        return gsea_category_path
