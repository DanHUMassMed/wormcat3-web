#!/bin/bash

ensure_conda_env() {
    local target_env="$1"
    if [ -z "$target_env" ]; then
        echo "Usage: ensure_conda_env <env_name>"
        return 1
    fi

    local CONDA_ENV="$(conda info --base)/bin"

    # Get the active conda environment
    local active_env
    active_env=$(conda info | grep "active environment" | cut -d: -f2 | tr -d '[:space:]')

    # Check if the active environment matches the target
    if [ "$active_env" != "$target_env" ]; then
        echo "You are not in the '$target_env' environment. Activating it now..."
        source "${CONDA_ENV}/activate" "$target_env"
    else
        echo "You are already in the '$target_env' environment."
    fi
}

ensure_conda_env wormcat3-web

export WORMCAT_OUT_PATH="/Users/dan/Code/Python/wormcat3-web/frontend/build/dynamic/wormcat_out"

if [ -n "$1" ]; then
    export LOG_LEVEL=$1
fi
if [ "$2" == "CLEAR_LOGS" ]; then
    rm backend.log 
    rm backend_testing.log
fi
if [ "$3" == "ACTIVATE_DEBUG" ]; then
    export ACTIVATE_DEBUG="TRUE"
fi
clear

uvicorn app.main:app --reload
