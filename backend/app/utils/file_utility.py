import os
from datetime import datetime
from pathlib import Path

WORMCAT_OUT_PATH = os.environ.get("WORMCAT_OUT_PATH")
if not WORMCAT_OUT_PATH:
    raise EnvironmentError("WORMCAT_OUT_PATH environment variable is not set.")

def get_upload_dir_path():
    return get_full_dir_path("../uploads")

def get_full_dir_path(relative_dir_path):
    dir_path = (Path(WORMCAT_OUT_PATH) / relative_dir_path).resolve()
    dir_path.mkdir(parents=True, exist_ok=True)
    return dir_path

def log_users(method_name, log_data):
    date_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    email = log_data.get("email", "")
    title = log_data.get("title", "")
    annotation_file_name = log_data.get("annotation_file_name", "")
    p_adjust_method = log_data.get("p_adjust_method", "")
    p_adjust_threshold = log_data.get("p_adjust_threshold", "")

    header = "date_time,method_name,email,title,annotation_file_name,p_adjust_method,p_adjust_threshold"

    HOME = os.environ.get("HOME")
    web_logs_dir_path = Path(HOME) / "var" / "log"
    web_logs_dir_path.mkdir(parents=True, exist_ok=True)
    user_log_file_path = web_logs_dir_path / "users.txt"

    file_exists = user_log_file_path.exists()
    file_empty = not file_exists or user_log_file_path.stat().st_size == 0

    with open(user_log_file_path, "a") as user_file:
        if file_empty:
            user_file.write(header + "\n")
        user_file.write(
            f"{date_time},{method_name},{email},{title},{annotation_file_name},{p_adjust_method},{p_adjust_threshold}\n"
        )            