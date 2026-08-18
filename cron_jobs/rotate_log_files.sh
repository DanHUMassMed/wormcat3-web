#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"

log_dir="$LOG_DIR"

# For every *.log file in the log directory
for log_file in "$log_dir"/*.log; do
    # Skip if no match (e.g., no .log files found)
    [ -e "$log_file" ] || continue

    # Remove .9 if it exists
    [ -f "${log_file}.9" ] && rm -f "${log_file}.9"

    # Rotate .8 → .9, ..., .0 → .1
    for i in {8..0}; do
        if [ -f "${log_file}.$i" ]; then
            mv "${log_file}.$i" "${log_file}.$((i + 1))"
        fi
    done

    # Rotate current log to .0
    mv "$log_file" "${log_file}.0"

    # Create a new empty file with same owner/permissions
    touch "$log_file"
    chown --reference="${log_file}.0" "$log_file"
    chmod --reference="${log_file}.0" "$log_file"
done