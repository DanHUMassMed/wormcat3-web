#!/bin/bash

ensure_uv_env() {
    local script_dir
    script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    local project_root
    project_root="$(cd "$script_dir/.." && pwd)"
    local venv_path="$project_root/.venv"

    if [ ! -d "$venv_path" ]; then
        echo "Virtual environment not found at $venv_path. Creating with uv..."
        if command -v uv &> /dev/null; then
            uv venv "$venv_path" --python 3.13 || return 1
        else
            echo "Error: uv is not installed or not in PATH."
            return 1
        fi
    fi

    # Activate virtual environment
    if [ -f "$venv_path/bin/activate" ]; then
        source "$venv_path/bin/activate"
    else
        echo "Error: Cannot find activation script at $venv_path/bin/activate"
        return 1
    fi

    # Export PYTHONPATH for backend & external wormcat3 library
    local backend_dir="$project_root/backend"
    local wormcat3_dir="$HOME/Code/Python/wormcat3"

    case ":$PYTHONPATH:" in
        *":$backend_dir:"*) ;;
        *) export PYTHONPATH="$backend_dir:$PYTHONPATH" ;;
    esac

    if [ -d "$wormcat3_dir" ]; then
        case ":$PYTHONPATH:" in
            *":$wormcat3_dir:"*) ;;
            *) export PYTHONPATH="$wormcat3_dir:$PYTHONPATH" ;;
        esac
    fi
}
