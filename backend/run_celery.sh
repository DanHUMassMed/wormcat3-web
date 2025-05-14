#!/bin/bash

export WORMCAT_OUT_PATH="/Users/dan/Code/Python/wormcat3-web/frontend/build/dynamic/wormcat_out"

celery -A celery_worker.celery worker --loglevel=info --concurrency=4
#celery -A celery_worker.celery worker --loglevel=info