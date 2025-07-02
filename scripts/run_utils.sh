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