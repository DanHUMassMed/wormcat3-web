import pytest
import os
# Set environment variable before app import
os.environ.setdefault("WORMCAT_OUT_PATH", "dynamic/wormcat_out")

from fastapi.testclient import TestClient
from app.main import app 

client = TestClient(app)

@pytest.fixture
def enrichment_payload():
    gene_set = ["WBGene00016360", "WBGene00002007", "WBGene00011978", "WBGene00000522", "WBGene00002058", "WBGene00018350", "WBGene00009306", 
                "WBGene00020070", "WBGene00008831", "WBGene00006533", "WBGene00006539", "WBGene00015225", "WBGene00016611", "WBGene00016735", 
                "WBGene00002174", "WBGene00006438", "WBGene00006649", "WBGene00016030", "WBGene00015776", "WBGene00018101", "WBGene00021495", 
                "WBGene00010047", "WBGene00022592", "WBGene00016260", "WBGene00011176", "WBGene00017430", "WBGene00001182", "WBGene00010870", 
                "WBGene00002881", "WBGene00007131", "WBGene00015216", "WBGene00015680", "WBGene00019858", "WBGene00019859", "WBGene00004053", 
                "WBGene00011888", "WBGene00002274", "WBGene00021020", "WBGene00016190", "WBGene00016215", "WBGene00011287", "WBGene00022284", 
                "WBGene00219316", "WBGene00022181", "WBGene00019748", "WBGene00003432", "WBGene00010988", "WBGene00018393", "WBGene00012295", 
                "WBGene00007480", "WBGene00011399", "WBGene00007745", "WBGene00016920", "WBGene00008132", "WBGene00011684", "WBGene00006609", 
                "WBGene00007517", "WBGene00002088", "WBGene00015423", "WBGene00021703", "WBGene00001152", "WBGene00001156", "WBGene00017659", 
                "WBGene00019978", "WBGene00020989", "WBGene00001099", "WBGene00001387", "WBGene00003591", "WBGene00018488", "WBGene00016716", 
                "WBGene00001240", "WBGene00015048", "WBGene00022200", "WBGene00001394", "WBGene00001397", "WBGene00001398", "WBGene00001399", 
                "WBGene00010296", "WBGene00010902", "WBGene00020962", "WBGene00016704", "WBGene00019376", "WBGene00008803", "WBGene00012585", 
                "WBGene00011768", "WBGene00018990", "WBGene00015295", "WBGene00009057", "WBGene00000512", "WBGene00010425", "WBGene00022781", 
                "WBGene00011517", "WBGene00007549", "WBGene00018398", "WBGene00013197", "WBGene00007536", "WBGene00017429", "WBGene00014215", 
                "WBGene00022178", "WBGene00014001", "WBGene00001425", "WBGene00010790", "WBGene00019298", "WBGene00022201", "WBGene00000138", 
                "WBGene00015930", "WBGene00008610", "WBGene00018226", "WBGene00018533", "WBGene00018958", "WBGene00077490", "WBGene00017304", 
                "WBGene00011416", "WBGene00020672", "WBGene00007440", "WBGene00016274", "WBGene00017060", "WBGene00008985", "WBGene00010488", 
                "WBGene00009383", "WBGene00007044", "WBGene00003602", "WBGene00008913", "WBGene00016272", "WBGene00016507", "WBGene00018129", 
                "WBGene00019958", "WBGene00021874", "WBGene00077525", "WBGene00206376", "WBGene00016752", "WBGene00000089", "WBGene00016282", 
                "WBGene00011955", "WBGene00019975", "WBGene00003752", "WBGene00018590", "WBGene00003746", "WBGene00003747", "WBGene00018886", 
                "WBGene00138721", "WBGene00010661", "WBGene00016872", "WBGene00008239", "WBGene00004778", "WBGene00006757", "WBGene00200503", 
                "WBGene00199325", "WBGene00199866", "WBGene00044971", "WBGene00194673", "WBGene00195065", "WBGene00196824", "WBGene00201035", 
                "WBGene00200201", "WBGene00197493", "WBGene00195625", "WBGene00194665", "WBGene00004509", "WBGene00043995", "WBGene00001560", 
                "WBGene00022538", "WBGene00009532", "WBGene00004096", "WBGene00004062", "WBGene00008019", "WBGene00001627", "WBGene00011090", 
                "WBGene00004802", "WBGene00019344", "WBGene00021487", "WBGene00019963", "WBGene00017678", "WBGene00012683", "WBGene00010507", 
                "WBGene00012144", "WBGene00000545", "WBGene00005647", "WBGene00005649", "WBGene00019411", "WBGene00003091", "WBGene00003093", 
                "WBGene00018278", "WBGene00016896", "WBGene00016187", "WBGene00017478", "WBGene00006063", "WBGene00006705", "WBGene00007574", 
                "WBGene00016891", "WBGene00017504", "WBGene00017786", "WBGene00018375", "WBGene00015362", "WBGene00013755", "WBGene00012624", 
                "WBGene00007392", "WBGene00018353", "WBGene00009839"]

    return {
        "gene_set": gene_set,
        "title": "Test Analysis",
        "email": "test@example.com",
        "annotation_file_name": "whole_genome_v2_nov-11-2021.csv",
        "p_adjust_method": "bonferroni",
        "p_adjust_threshold": 0.05
    }


def test_analyze_enrichment_success(enrichment_payload):
    response = client.post("/wormcat3/analyze_and_visualize_enrichment", json=enrichment_payload)
    
    assert response.status_code == 200, f"Unexpected status code: {response.status_code}"
    data = response.json()
    
    assert "run_id" in data, "run_id not found in response"
    assert isinstance(data["run_id"], str), "run_id should be a string"
