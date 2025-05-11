import time
import os
import redis
import json
import time
from celery import Celery
from app.utils.email_utility import email_results
from pathlib import Path

celery = Celery(
    "worker",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

WORMCAT_OUT_PATH="/Users/dan/Code/Python/wormcat3-web/public"
UPLOAD_DIR = Path(WORMCAT_OUT_PATH)/ "dynamic/uploads"

redis_server = redis.Redis(host='localhost', port=6379, db=0)

@celery.task(bind=True)
def long_running_task(self, task_id):
    print("long running task called")
    for i in range(50):
        msg = json.dumps({"state": "PROGRESS", "progress": i})
        redis_server.publish(f"task:{task_id}", msg)
        print(f"publish {msg}")
        time.sleep(0.1)
        
    msg = json.dumps({"state": "COMPLETED", "result_url": f"{UPLOAD_DIR}"})
    redis_server.publish(f"task:{task_id}",msg )
    return {"status": "completed"}

@celery.task(bind=True)
def long_task(self, email_to: str):
    # Simulate long-running job
    for i in range(5):
        time.sleep(1)
    try:
        file_nm = "9bc24236-53d3-4b40-962b-92dd8a6faae1/N2-N2S_alldetected.csv"
        input_file_path=f"{UPLOAD_DIR}/{file_nm}"
        receiver="daniel.higgins@umassmed.edu"
        email_results(receiver, input_file_path)
    except Exception as e:
        return {"status": "failed", "reason": str(e)}

    return {"status": "done", "email": email_to}

