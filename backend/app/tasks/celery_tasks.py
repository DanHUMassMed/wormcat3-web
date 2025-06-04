import json
import os
import time
from pathlib import Path

import redis
from app.utils.email_utility import email_results, email_error_results
from app.utils.file_utility import WORMCAT_OUT_PATH, get_upload_dir_path
from celery import Celery
from dotenv import load_dotenv
from wormcat3 import Wormcat, file_util
from wormcat3.constants import PAdjustMethod
from wormcat3.file_util import zip_dir
from wormcat3.gsea_analyzer import GSEAAnalyzer
from wormcat3.wormcat_excel import WormcatExcel

load_dotenv() 

import logging

logger = logging.getLogger()
logger.setLevel(os.getenv("LOG_LEVEL", "WARNING").upper())

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
        msg = json.dumps({"state": "FAILED","message":f"ERROR: Extracting Excel files| [{e}]"})
        redis_client.publish(f"task:{task_id}", msg)
        time.sleep(0.3)
        return {"status": "failed"}

    # Look for CSV files
    csv_files = list(csv_file_path.glob('*.csv'))  
    increment =  int(80 / len(csv_files))
    try:
        for file in csv_files:
            percent_complete += increment
            msg = json.dumps({"state": "PROGRESS", "progress": percent_complete,"message":f"Processing {file.stem} sheet"})
            redis_client.publish(f"task:{task_id}", msg)
            time.sleep(0.3)
            wormcat = Wormcat(working_dir_path=working_dir_path, annotation_file_name=enrichment_request['annotation_file_name'], title=file.stem)
            wormcat.analyze_and_visualize_enrichment(str(file), enrichment_request['background'], 
                                                    p_adjust_method = PAdjustMethod.from_str(enrichment_request['p_adjust_method']), 
                                                    p_adjust_threshold = ensure_float(enrichment_request['p_adjust_threshold']))
        
    except Exception as e:
        msg = json.dumps({"state": "FAILED","message":f"ERROR: Processing Enrichment| [{e}]"})
        redis_client.publish(f"task:{task_id}", msg)
        time.sleep(0.3)
        return {"status": "failed"}

    percent_complete += 10
    msg = json.dumps({"state": "PROGRESS", "progress": percent_complete,"message":"Summarizing Analysis Results"})
    redis_client.publish(f"task:{task_id}", msg)
    time.sleep(0.3)
    
    try:
        annotation_file_path = wormcat_base.annotation_manager.annotation_file_path
        wormcat_excel = WormcatExcel()
        wormcat_excel.create_summary_spreadsheet(working_dir_path, annotation_file_path, f"{working_dir_path}/{Path(working_dir_path).stem}.xlsx")
        
        output_zip_path = zip_dir(working_dir_path)
        zip_file_name = Path(output_zip_path).name
        msg = json.dumps({"state": "COMPLETED", "result_url": zip_file_name, "message":"Analysis completed successfully"})
        redis_client.publish(f"task:{task_id}", msg )
    except Exception as e:
        msg = json.dumps({"state": "FAILED","message":f"ERROR: Creating Summary| [{e}]"})
        redis_client.publish(f"task:{task_id}", msg)
        time.sleep(0.3)
        return {"status": "failed"}
    
    return {"status": "completed"}

@celery.task(bind=True)
def run_and_email_task(self, enrichment_request: dict, task_id: str):

    try:
        wormcat = Wormcat(working_dir_path=WORMCAT_OUT_PATH, 
                          title=enrichment_request['title'], 
                          annotation_file_name=enrichment_request['annotation_file_name'], 
                          email=enrichment_request['email'])
        
        input_file_path=f"{get_upload_dir_path()}/{enrichment_request['gene_set']}"
        wormcat.wormcat_batch(
                    input_data = input_file_path, 
                    background_input = enrichment_request['background'], 
                    p_adjust_method = PAdjustMethod.from_str(enrichment_request['p_adjust_method']), 
                    p_adjust_threshold = ensure_float(enrichment_request['p_adjust_threshold']))

        output_zip_path = zip_dir(wormcat.working_dir_path)
        email_results(enrichment_request['email'], output_zip_path)
    except Exception as e:
        message = str(e)
        logger.error(f"run_and_email_task ERROR: {message}")
        email_error_results(enrichment_request['email'], wormcat.run_number, message)



@celery.task(bind=True)
def run_gsea_and_wait_task(self, gsea_request: dict, task_id: str):
    percent_complete = 15
    wormcat_base = Wormcat(working_dir_path=WORMCAT_OUT_PATH, annotation_file_name=gsea_request['annotation_file_name'], title=gsea_request['title'])
        
    try:
        gsea_file_path = f"{get_upload_dir_path()}/{gsea_request['gene_set']}"
        deseq2_df = file_util.read_deseq2_file(gsea_file_path)

        gsea_analyzer = GSEAAnalyzer(wormcat_base.working_dir_path)
        removed_rows_df, deseq2_df = gsea_analyzer.clean_input_data(deseq2_df)

        # Save the removed rows
        if not removed_rows_df.empty:            
            removed_file_name = f"genes_removed_from_analysis_{wormcat_base.run_number}.csv"
            removed_path = Path(wormcat_base.working_dir_path) / removed_file_name
            removed_rows_df.to_csv(removed_path, index=False)


        ranked_list_df = gsea_analyzer.create_ranked_list(deseq2_df)
        
        msg = json.dumps({"state": "PROGRESS", "progress": percent_complete,"message":"Creating ranked list"})
        redis_client.publish(f"task:{task_id}", msg)
        time.sleep(0.3)
    except Exception as e:
        msg = json.dumps({"state": "FAILED","message":f"ERROR: Creating ranked list| [{e}]"})
        redis_client.publish(f"task:{task_id}", msg)
        time.sleep(0.3)
        return {"status": "failed"}

    first_3_ids = ranked_list_df['Gene'].head(3).tolist()
    gene_type = wormcat_base.annotation_manager.get_gene_id_type(first_3_ids)
    
    increment =  25
    try:
        for category in [1,2,3]:
            percent_complete += increment
            msg = json.dumps({"state": "PROGRESS", "progress": percent_complete,"message":f"Processing Category {category} sheet"})
            redis_client.publish(f"task:{task_id}", msg)
            time.sleep(0.3)
            
            gmt_format = wormcat_base.annotation_manager.category_to_gmt_format(category, id_col_nm=gene_type)
            results_name = f"gsea_category_{category}_{wormcat_base.run_number}"
            results_df = gsea_analyzer.run_preranked_gsea(ranked_list_df , gmt_format, results_name)
            # Save the results_df
            gsea_category_path = Path(wormcat_base.working_dir_path) / f"{results_name}.csv"
            results_df.to_csv(gsea_category_path, index=False)
    except Exception as e:
        msg = json.dumps({"state": "FAILED","message":f"ERROR: Failed running GSEA| [{e}]"})
        redis_client.publish(f"task:{task_id}", msg)
        time.sleep(0.3)
        return {"status": "failed"}


    percent_complete += 10
    msg = json.dumps({"state": "PROGRESS", "progress": percent_complete,"message":"Summarizing Analysis Results"})
    redis_client.publish(f"task:{task_id}", msg)
    time.sleep(0.3)
    try:
        output_zip_path = zip_dir(wormcat_base.working_dir_path)
        zip_file_name = Path(output_zip_path).name
        msg = json.dumps({"state": "COMPLETED", "result_url": zip_file_name, "message":"GSEA completed successfully"})
        redis_client.publish(f"task:{task_id}", msg )
    except Exception as e:
        msg = json.dumps({"state": "FAILED","message":f"ERROR: Finalizing GSEA| [{e}]"})
        redis_client.publish(f"task:{task_id}", msg)
        time.sleep(0.3)
        return {"status": "failed"}

    return {"status": "completed"}
