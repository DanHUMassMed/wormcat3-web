#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_UTILS="$SCRIPT_DIR/../scripts/run_utils.sh"
source "$RUN_UTILS"

clear
ensure_conda_env wormcat3-web

export WORMCAT_OUT_PATH="${HOME}/Code/Python/wormcat3-web/frontend/build/dynamic/wormcat_out"

if [ -n "$1" ]; then
    export WORMCAT_LOG_LEVEL=$1
fi
if [ "$2" == "CLEAR_LOGS" ]; then
    rm backend.log 
    rm backend_testing.log
fi
if [ "$3" == "ACTIVATE_DEBUG" ]; then
    export ACTIVATE_DEBUG="TRUE"
fi


NUM_WORKERS=3
TIMEOUT=120
PID_FILE="gunicorn.pid"
PORT=8000

#uvicorn app.main:app --reload
gunicorn app.main:app \
--workers $NUM_WORKERS \
--worker-class uvicorn.workers.UvicornWorker \
--timeout $TIMEOUT \
--log-level=debug \
--bind=0.0.0.0:$PORT \
--pid=$PID_FILE