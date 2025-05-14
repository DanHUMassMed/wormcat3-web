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
from wormcat3.wormcat_excel import WormcatExcel
from wormcat3 import file_util
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
def run_and_wait_task(self, enrichment_request: dict, task_id: str):
    print("run_and_wait_task called")
    percent_complete = 10
    
    wormcat_base = Wormcat(working_dir_path=WORMCAT_OUT_PATH, annotation_file_name=enrichment_request['annotation_file_name'], title=enrichment_request['title'])
    working_dir_path = wormcat_base.working_dir_path
        
    try:
        excel_file_path = f"{get_upload_dir_path()}/{enrichment_request['gene_set']}"

        csv_file_name = Path(enrichment_request['gene_set'])
        csv_file_path = Path(working_dir_path) /f"{csv_file_name.stem}_CSVs"        
        WormcatExcel.extract_csv_files(excel_file_path, csv_file_path)
        msg = json.dumps({"state": "PROGRESS", "progress": percent_complete,"message":"Extracting Excel files"})
        redis_client.publish(f"task:{task_id}", msg)
        time.sleep(0.3)
    except Exception as e:
        print(f"Error: {str(e)}")
        return

    # Look for CSV files
    csv_files = list(csv_file_path.glob('*.csv'))  
    increment =  int(80 / len(csv_files))
    if csv_files:
        for file in csv_files:
            percent_complete += increment
            msg = json.dumps({"state": "PROGRESS", "progress": percent_complete,"message":f"Processing {file.stem} sheet"})
            redis_client.publish(f"task:{task_id}", msg)
            time.sleep(0.3)
            wormcat = Wormcat(working_dir_path=working_dir_path, annotation_file_name=enrichment_request['annotation_file_name'], title=file.stem)
            wormcat.analyze_and_visualize_enrichment(str(file), enrichment_request['background'], 
                                                     p_adjust_method = PAdjustMethod.from_str(enrichment_request['p_adjust_method']), 
                                                     p_adjust_threshold = ensure_float(enrichment_request['p_adjust_threshold']))
    else:
        print(f"Directory doesn't contain any CSV files")
        return 

    percent_complete += 10
    msg = json.dumps({"state": "PROGRESS", "progress": percent_complete,"message":"Summarizing Analysis Results"})
    redis_client.publish(f"task:{task_id}", msg)
    time.sleep(0.3)
    annotation_file_path = wormcat_base.annotation_manager.annotation_file_path
    wormcat_excel = WormcatExcel()
    wormcat_excel.create_summary_spreadsheet(working_dir_path, annotation_file_path, f"{working_dir_path}/{Path(working_dir_path).stem}.xlsx")
    
    output_zip_path = zip_dir(working_dir_path)
    zip_file_name = Path(output_zip_path).name
    msg = json.dumps({"state": "COMPLETED", "result_url": zip_file_name, "message":"Analysis completed successfully"})
    redis_client.publish(f"task:{task_id}", msg )
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



