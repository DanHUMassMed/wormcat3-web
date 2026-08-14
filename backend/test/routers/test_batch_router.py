import os
os.environ.setdefault("WORMCAT_OUT_PATH", "dynamic/wormcat_out")

from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.schemas.progress_models import ProgressEvent, ProgressState

client = TestClient(app)


@patch("app.routers.batch_router.run_and_wait_task.apply_async")
@patch("app.services.progress_publisher.RedisProgressPublisher.publish_async", new_callable=AsyncMock)
def test_run_and_wait_endpoint(mock_publish, mock_apply_async):
    payload = {
        "gene_set": "test_set.xlsx",
        "title": "Test Batch Run",
        "email": "test@example.com",
        "annotation_file_name": "whole_genome_v2_nov-11-2021.csv",
        "p_adjust_method": "bonferroni",
        "p_adjust_threshold": 0.05,
    }
    response = client.post("/wormcat3/run_and_wait", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "run_id" in data
    assert len(data["run_id"]) > 0
    assert mock_apply_async.called
    assert mock_publish.called


@patch("app.services.progress_publisher.RedisProgressPublisher.get_state_async", new_callable=AsyncMock)
def test_get_task_status_endpoint(mock_get_state):
    task_id = "test-task-12345"
    mock_get_state.return_value = ProgressEvent(
        task_id=task_id,
        state=ProgressState.PROGRESS,
        progress=70,
        message="Processing Sheet 2",
        download_url="/dynamic/wormcat_out/test.zip",
    )

    response = client.get(f"/wormcat3/status/{task_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["task_id"] == task_id
    assert data["state"] == "PROGRESS"
    assert data["progress"] == 70
    assert data["message"] == "Processing Sheet 2"


@patch("app.services.progress_publisher.RedisProgressPublisher.get_state_async", new_callable=AsyncMock)
def test_get_task_status_not_found(mock_get_state):
    mock_get_state.return_value = None
    response = client.get("/wormcat3/status/non-existent-task")
    assert response.status_code == 404
