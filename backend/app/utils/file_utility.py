import os
import uuid
from pathlib import Path
import pandas as pd
import re
import zipfile

WORMCAT_OUT_PATH = os.environ.get("WORMCAT_OUT_PATH")
if not WORMCAT_OUT_PATH:
    raise EnvironmentError("WORMCAT_OUT_PATH environment variable is not set.")

def get_upload_dir_path():
    upload_dir_path = (Path(WORMCAT_OUT_PATH) / "../uploads").resolve()
    upload_dir_path.mkdir(parents=True, exist_ok=True)
    return upload_dir_path
