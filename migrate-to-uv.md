# Migration Plan: Conda to `uv` and `.venv`

## Executive Summary & Objectives
This document provides a comprehensive implementation plan to migrate the **wormcat3-web** project from a global Conda environment (`wormcat3-web`) to a localized `uv`-managed virtual environment (`.venv`).

### Key Motivations
- **Fast, Deterministic Package Resolution**: `uv` is significantly faster than Conda/pip for package installation and resolution.
- **Project Hermeticity**: Keeping `.venv` inside the project root eliminates reliance on global environment state and machine-specific Miniforge paths (`/Users/dan/miniforge3/envs/wormcat3-web`).
- **Standardized Developer Workflow**: Consolidating environment creation, testing, linting, and server execution under `uv` and a root `Makefile`.

---

## Codebase Audit: Conda Dependencies & References

The following components currently depend on Conda or global paths:

1. **[scripts/run_utils.sh](file:///Users/dan/Code/Python/wormcat3-web/scripts/run_utils.sh)**
   - Defines `ensure_conda_env()`, which checks for `conda`, loads `conda.sh`, and executes `conda activate`.
2. **[backend/run_api.sh](file:///Users/dan/Code/Python/wormcat3-web/backend/run_api.sh#L7)**
   - Calls `ensure_conda_env wormcat3-web`.
3. **[backend/run_celery.sh](file:///Users/dan/Code/Python/wormcat3-web/backend/run_celery.sh#L6)**
   - Calls `ensure_conda_env wormcat3-web`.
4. **[frontend/run_react.sh](file:///Users/dan/Code/Python/wormcat3-web/frontend/run_react.sh#L6)**
   - Calls `ensure_conda_env wormcat3-web`.
5. **[README.md](file:///Users/dan/Code/Python/wormcat3-web/README.md#L3-L9)**
   - Instructs configuring `activate.d/env_vars.sh` in Conda to add `/Users/dan/Code/Python/wormcat3` to `PYTHONPATH`.
6. **[.gitignore](file:///Users/dan/Code/Python/wormcat3-web/.gitignore)**
   - Does not currently ignore `.venv/` or `.uv/`.

---

## Detailed Migration Phases

### Phase 1: Environment Bootstrapping & `pyproject.toml`
1. **Initialize `pyproject.toml`**:
   Create a standard `pyproject.toml` in the project root defining Python 3.13+ constraints, project dependencies, and dev tools (`pytest`, `ruff`). `pyproject.toml` serves as the single canonical source of truth for dependencies (`requirements.txt` removed).
2. **Setup Local Virtual Environment**:
   Use `uv venv .venv --python 3.13` to construct a local `.venv` in the project root.
3. **Ignore `.venv` in Version Control**:
   Add `.venv/` and `.uv/` to [.gitignore](file:///Users/dan/Code/Python/wormcat3-web/.gitignore).

### Phase 2: Refactoring Activation & Runner Scripts
1. **Update [scripts/run_utils.sh](file:///Users/dan/Code/Python/wormcat3-web/scripts/run_utils.sh)**:
   Replace `ensure_conda_env()` with `ensure_uv_env()`:
   - Check if `.venv` exists at project root (`${SCRIPT_DIR}/../.venv`). If absent, run `uv venv`.
   - Source `${SCRIPT_DIR}/../.venv/bin/activate`.
   - Export `PYTHONPATH`: Include project backend (`backend`) and external core library (`/Users/dan/Code/Python/wormcat3`).
2. **Update Runner Scripts**:
   - In [backend/run_api.sh](file:///Users/dan/Code/Python/wormcat3-web/backend/run_api.sh), replace `ensure_conda_env wormcat3-web` with `ensure_uv_env`.
   - In [backend/run_celery.sh](file:///Users/dan/Code/Python/wormcat3-web/backend/run_celery.sh), replace `ensure_conda_env wormcat3-web` with `ensure_uv_env`.
   - In [frontend/run_react.sh](file:///Users/dan/Code/Python/wormcat3-web/frontend/run_react.sh), replace `ensure_conda_env wormcat3-web` with `ensure_uv_env`.

### Phase 3: Creating Root `Makefile`
Create a root [Makefile](file:///Users/dan/Code/Python/wormcat3-web/Makefile) implementing standard developer entrypoints:
- `make install`: Bootstraps `.venv` via `uv venv .venv` and installs editable package dependencies using `uv pip install --python .venv -e . -e ../wormcat3`.
- `make test`: Runs test suite via `uv run pytest`.
- `make lint`: Executes code quality and formatting checks (`uv run ruff check .`).
- `make dev`: Starts local services (`./sys_ctrl.sh start`).
- `make clean`: Removes `.venv`, `.pytest_cache`, and transient build files.

### Phase 4: Updating Documentation
Update [README.md](file:///Users/dan/Code/Python/wormcat3-web/README.md) to detail:
- Prerequisites (`uv` >= 0.5+).
- Quickstart using `make install` and `make dev`.
- `PYTHONPATH` configuration handling within `.venv`.

---

## Verification & Validation Plan

1. **Environment Setup Verification**:
   - Run `make install` to create `.venv` and install dependencies.
   - Verify python binary: `uv run python --version` (should be Python 3.12+).
2. **Script Activation Verification**:
   - Execute `./scripts/run_utils.sh` helper functions and confirm `.venv` activates cleanly without error.
3. **Backend & Worker Runtime Verification**:
   - Run `./sys_ctrl.sh start` and verify status with `./sys_ctrl.sh status`.
   - Ensure `gunicorn` (FastAPI) and `celery` processes run within the `.venv` context.
4. **Test Suite Verification**:
   - Execute `make test` (`uv run pytest`) and confirm all test cases pass.
