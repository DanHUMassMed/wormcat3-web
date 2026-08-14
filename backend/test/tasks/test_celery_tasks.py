from unittest.mock import MagicMock, patch

from app.schemas.progress_models import ProgressState
from app.tasks.celery_tasks import run_and_wait_task


@patch("app.tasks.celery_tasks.progress_publisher.publish")
@patch("app.tasks.celery_tasks.Wormcat")
@patch("app.tasks.celery_tasks.EnrichmentAnalysisEngine.extract_excel_sheets")
@patch("app.tasks.celery_tasks.EnrichmentAnalysisEngine.analyze_single_sheet")
@patch("app.tasks.celery_tasks.EnrichmentAnalysisEngine.build_summary_workbook")
def test_run_and_wait_task_success(
    mock_build_summary,
    mock_analyze_sheet,
    mock_extract_sheets,
    mock_wormcat_cls,
    mock_publish,
):
    mock_wormcat = MagicMock()
    mock_wormcat.working_dir_path = "/tmp/test_dir"
    mock_wormcat_cls.return_value = mock_wormcat

    sheet_mock = MagicMock()
    sheet_mock.stem = "Sheet1"
    mock_extract_sheets.return_value.glob.return_value = [sheet_mock]
    mock_build_summary.return_value = "output_123.zip"

    enrichment_request = {
        "gene_set": "test.xlsx",
        "title": "Test Title",
        "annotation_file_name": "whole_genome_v2_nov-11-2021.csv",
        "p_adjust_method": "bonferroni",
        "p_adjust_threshold": 0.05,
    }

    result = run_and_wait_task.apply(
        kwargs={"enrichment_request": enrichment_request, "task_id": "task-test-123"}
    ).get()

    assert result["status"] == "completed"
    assert result["result_url"] == "output_123.zip"
    assert mock_publish.called

    # Verify terminal completion event
    last_event = mock_publish.call_args_list[-1][0][0]
    assert last_event.state == ProgressState.COMPLETED
    assert last_event.result_url == "output_123.zip"
    assert last_event.report_id == "task-test-123"


@patch("app.tasks.celery_tasks.progress_publisher.publish")
@patch("app.tasks.celery_tasks.Wormcat")
def test_run_and_wait_task_failure(mock_wormcat_cls, mock_publish):
    mock_wormcat_cls.side_effect = RuntimeError("File not found or disk error")

    enrichment_request = {
        "gene_set": "missing.xlsx",
        "title": "Test Title",
        "annotation_file_name": "whole_genome_v2_nov-11-2021.csv",
        "p_adjust_method": "bonferroni",
        "p_adjust_threshold": 0.05,
    }

    result = run_and_wait_task.apply(
        kwargs={"enrichment_request": enrichment_request, "task_id": "task-fail-123"}
    ).get()

    assert result["status"] == "failed"
    last_event = mock_publish.call_args_list[-1][0][0]
    assert last_event.state == ProgressState.FAILED
    assert "File not found" in last_event.message
