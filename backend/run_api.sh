#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"
RUN_UTILS="$SCRIPT_DIR/../scripts/run_utils.sh"
source "$RUN_UTILS"

clear
ensure_uv_env

# Valid log levels: DEBUG, INFO, WARNING, ERROR
export WORMCAT_LOG_LEVEL="DEBUG"
export WORMCAT_LOG_PATH="$LOG_DIR/wormcat3.log"

while [[ $# -gt 0 ]]; do
    case "$1" in
        -l|--log-level)
            export WORMCAT_LOG_LEVEL="$2"
            shift 2
            ;;
        -c|--clear-logs)
            rm -f backend.log backend_testing.log
            shift
            ;;
        -d|--debug|ACTIVATE_DEBUG)
            export ACTIVATE_DEBUG="TRUE"
            shift
            ;;
        *)
            # Handle positional parameter or fallback (e.g. if passed without flags)
            echo "Unknown option: $1" >&2
            shift
            ;;
    esac
done

NUM_WORKERS=3
TIMEOUT=120
RESTART_REQUEST_TIMEOUT=30
PID_FILE="gunicorn.pid"
PORT=8000

#uvicorn app.main:app --reload
if [[ "$ACTIVATE_DEBUG" == "TRUE" ]]; then
    uvicorn app.main:app --reload --host 0.0.0.0 --port $PORT
else
    gunicorn app.main:app \
    --workers $NUM_WORKERS \
    --graceful-timeout $RESTART_REQUEST_TIMEOUT \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --worker-class uvicorn.workers.UvicornWorker \
    --timeout $TIMEOUT \
    --log-level=debug \
    --bind=0.0.0.0:$PORT \
    --pid=$PID_FILE
fi


