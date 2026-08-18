import os
from datetime import datetime
from pathlib import Path
from typing import Any
from dotenv import load_dotenv

load_dotenv()

WORMCAT_OUT_PATH = os.environ.get("WORMCAT_OUT_PATH", "../dynamic/wormcat_out")


def get_logs_dir_path() -> Path:
    """Return the project logs directory path, creating it if needed."""
    env_log_path = os.environ.get("WORMCAT_LOG_PATH")
    if env_log_path:
        log_dir = Path(env_log_path).parent
    else:
        log_dir = Path(__file__).resolve().parents[3] / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir


def get_upload_dir_path() -> Path:
    return get_full_dir_path("../uploads")


def get_full_dir_path(relative_dir_path: str) -> Path:
    dir_path = (Path(WORMCAT_OUT_PATH) / relative_dir_path).resolve()
    dir_path.mkdir(parents=True, exist_ok=True)
    return dir_path


def log_users(method_name: str, log_data: dict[str, Any]) -> None:
    date_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    email = log_data.get("email", "")
    title = log_data.get("title", "")
    annotation_file_name = log_data.get("annotation_file_name", "")
    p_adjust_method = log_data.get("p_adjust_method", "")
    p_adjust_threshold = log_data.get("p_adjust_threshold", "")

    header = "date_time,method_name,email,title,annotation_file_name,p_adjust_method,p_adjust_threshold"

    user_log_file_path = get_logs_dir_path() / "users.txt"

    file_exists = user_log_file_path.exists()
    file_empty = not file_exists or user_log_file_path.stat().st_size == 0

    with open(user_log_file_path, "a", encoding="utf-8") as user_file:
        if file_empty:
            user_file.write(header + "\n")
        user_file.write(
            f"{date_time},{method_name},{email},{title},{annotation_file_name},{p_adjust_method},{p_adjust_threshold}\n"
        )            