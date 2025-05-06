from celery import Celery
from celery.exceptions import SoftTimeLimitExceeded
import redis
import json
import time
import os
from datetime import datetime
from shutil import make_archive

# Configure Celery
celery = Celery('tasks', broker='redis://localhost:6379/0', backend='redis://localhost:6379/0')

# Configure Redis
redis_server = redis.Redis(host='localhost', port=6379, db=0)

# Constants
DYNAMIC_DIR = './static/dynamic'
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TASK_TIME_LIMIT = 510
TASK_SOFT_TIME_LIMIT = 500

def publish_update(redis_channel, update_type, value, **extra_data):
    """Publish update to Redis channel for WebSocket consumption"""
    if redis_channel:
        data = {
            'state': 'PROGRESS',
            'name': update_type,
            'value': value,
            **extra_data
        }
        
        # Calculate progress percentage
        if update_type == 'SHEETS':
            current = 10  # Starting progress
            data['current'] = current
            data['total'] = 100
            data['status'] = 'Preparing Sheets'
        elif update_type == 'MESSAGE':
            current = data.get('current', 20)
            data['total'] = 100
            data['status'] = value
        elif update_type == 'DONE':
            data['state'] = 'SUCCESS'
            data['current'] = 100
            data['total'] = 100
            data['status'] = 'Batch completed!'
            data['result'] = f"./static/download/{value}.zip"
        
        # Store latest status in Redis for HTTP API fallback
        redis_server.set(f"task_status:{redis_channel}", json.dumps(data), ex=3600)  # Expire after 1 hour
        
        # Publish to Redis channel for WebSocket
        redis_server.publish(f"task_updates:{redis_channel}", json.dumps(data))
        
        # For backward compatibility with the old system
        if not data.get('use_websocket', True):
            redis_server.lpush(redis_channel, json.dumps({'name': update_type, 'value': value}))

@celery.task(time_limit=TASK_TIME_LIMIT, soft_time_limit=TASK_SOFT_TIME_LIMIT)
def send_async_email(params):
    try:
        print("send_async_email STARTED  !!!!")
        redis_channel = params.get('redis_channel')
        
        # Publish initial status
        if redis_channel:
            publish_update(redis_channel, 'MESSAGE', 'Starting batch process...', current=5)
            time.sleep(1)  # Simulate some work
            
            # Simulate processing steps with progress updates
            publish_update(redis_channel, 'SHEETS', 5, current=10)
            time.sleep(2)  # Simulate some work
            
            for i in range(1, 9):
                publish_update(redis_channel, 'MESSAGE', f'Processing batch {i} of 8...', 
                              current=10 + i*10)
                time.sleep(1)  # Simulate some work
        
        # Run the actual batch process
        dir_nm = run_wormcat_batch(params['batch_user'],
                                  params['annotation_file'],
                                  params['xsl_file_nm'],
                                  redis_channel=redis_channel,
                                  suffix=params['suffix'])
        
        # Create zip file of results
        root_dir = "{}/{}".format(DYNAMIC_DIR, dir_nm)
        base_name = "./static/download/{}".format(dir_nm)
        make_archive(base_name, 'zip', root_dir=root_dir)
        zip_file = "{}.zip".format(base_name)
        
        # Send email if needed
        email = params.get('email')
        if email:
            email_results(email, zip_file)
            os.remove(zip_file)
        
        # Signal completion
        if redis_channel:
            publish_update(redis_channel, 'DONE', dir_nm)
            
    except SoftTimeLimitExceeded:
        print("SoftTimeLimitExceeded  !!!! {} XX".format(BASE_DIR))
        err_file_nm = "{}/static/dynamic/async_email_timeout.txt".format(BASE_DIR)
        with open(err_file_nm, "a+") as err_file:
            err_file.write(
                "{}, {}, {}\n".format(params.get('email'), params.get('xsl_file_nm'), params.get('redis_channel')))
                
        # Publish error to WebSocket
        if params.get('redis_channel'):
            publish_update(params['redis_channel'], 'ERROR', 'Process timed out', 
                          state='FAILURE', current=100, total=100, 
                          status='Process timed out after exceeding the time limit')
        
        # Send email notification about error
        receiver = params.get('email')
        if receiver:
            sender = "wormcat@gmail.com"
            message_text = "Sorry an Error occurred during processing of your batch file.\nPlease try again later."
            subject = "Error running Wormcat"
            message = construct_message_with_html(subject, sender, receiver, message_text)
            send_message(sender, receiver, message)

# This function would be implemented according to your application's logic
def run_wormcat_batch(batch_user, annotation_file, xsl_file_nm, redis_channel=None, suffix=None):
    """Run the WormCat batch processing"""
    # Placeholder for the actual implementation
    # This would be your existing code that does the batch processing
    
    # For demo purposes, we'll just simulate some work
    if redis_channel:
        publish_update(redis_channel, 'MESSAGE', 'Processing annotations...', current=30)
        time.sleep(1)
        publish_update(redis_channel, 'MESSAGE', 'Analyzing data...', current=50)
        time.sleep(1)
        publish_update(redis_channel, 'MESSAGE', 'Generating visualizations...', current=70)
        time.sleep(1)
        publish_update(redis_channel, 'MESSAGE', 'Finalizing results...', current=90)
        time.sleep(1)
    
    # Return the directory name where results are stored
    dir_nm = f"{batch_user}_{suffix}" if suffix else f"{batch_user}_{int(time.time())}"
    return dir_nm

# These functions would be implemented according to your application's logic
def email_results(email, zip_file):
    """Send email with results"""
    # Implementation would go here
    pass

def construct_message_with_html(subject, sender, receiver, message_text):
    """Construct email message"""
    # Implementation would go here
    return message_text

def send_message(sender, receiver, message):
    """Send email message"""
    # Implementation would go here
    pass