import os
os.environ.setdefault("WORMCAT_OUT_PATH", "dynamic/wormcat_out")

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_run_and_wait_endpoint():
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
