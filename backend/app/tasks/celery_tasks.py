import time
import os
import redis
import json
import time
from celery import Celery
from app.utils.email_utility import email_results
from pathlib import Path
from wormcat3 import Wormcat
from wormcat3.file_util import zip_dir
from wormcat3.constants import PAdjustMethod
from app.utils.file_utility import WORMCAT_OUT_PATH, get_upload_dir_path

celery = Celery(
    "worker",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

redis_client = redis.Redis(host='localhost', port=6379, db=0)

#TODO update timeouts
TASK_TIME_LIMIT = 510
TASK_SOFT_TIME_LIMIT = 500
#@celery.task(time_limit=TASK_TIME_LIMIT, soft_time_limit=TASK_SOFT_TIME_LIMIT)
#try{ }except SoftTimeLimitExceeded:

def ensure_float(value):
    if isinstance(value, float):
        return value
    elif isinstance(value, str):
        try:
            return float(value)
        except ValueError:
            raise ValueError(f"Cannot convert string to float: '{value}'")
    else:
        raise ValueError(f"Value must be a float or a string representing a float, got {type(value).__name__}")
    
@celery.task(bind=True)
def run_and_wait_task(self, task_id):
    print("long running task called")
    for i in range(50):
        msg = json.dumps({"state": "PROGRESS", "progress": i})
        redis_client.publish(f"task:{task_id}", msg)
        print(f"publish {msg}")
        time.sleep(0.1)
        
    msg = json.dumps({"state": "COMPLETED", "result_url": f"RESULTS_URL_TO_BE_ADDED"})
    redis_client.publish(f"task:{task_id}",msg )
    return {"status": "completed"}

@celery.task(bind=True)
def run_and_email_task(self, enrichment_request: dict, task_id: str):
    print("run_and_email_task called")
    try:
        wormcat = Wormcat(working_dir_path=WORMCAT_OUT_PATH, 
                          title=enrichment_request['title'], 
                          annotation_file_name=enrichment_request['annotation_file_name'], 
                          email=enrichment_request['email'])
        
        input_file_path=f"{get_upload_dir_path()}/{enrichment_request['gene_set']}"
        print(f"""input_file_path: {input_file_path}""")
        wormcat.wormcat_batch(
                    input_data = input_file_path, 
                    background_input = enrichment_request['background'], 
                    p_adjust_method = PAdjustMethod.from_str(enrichment_request['p_adjust_method']), 
                    p_adjust_threshold = ensure_float(enrichment_request['p_adjust_threshold']))

        output_zip_path = zip_dir(wormcat.working_dir_path)
        email_results(enrichment_request['email'], output_zip_path)
    except Exception as e:
        print("run_and_email_task failed!!")
        print(str(e))



