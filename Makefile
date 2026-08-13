.PHONY: help install build dev start-dev start-prod stop status test lint clean ensure-uv

export PATH := $(HOME)/.local/bin:$(HOME)/.cargo/bin:$(PATH)

VENV := .venv
PYTHON := $(VENV)/bin/python
UV := $(shell command -v uv 2>/dev/null || echo "$(HOME)/.local/bin/uv")

help:
	@echo "Available commands:"
	@echo "  make install    - Create .venv and install all dependencies via uv & npm"
	@echo "  make build      - Build frontend production static assets"
	@echo "  make start-dev  - Start development services (Prefect, API, React Dev server)"
	@echo "  make start-prod - Build & start production services (Prefect, API, React Express server)"
	@echo "  make stop       - Stop all running services"
	@echo "  make status     - Check status of running services"
	@echo "  make test       - Run pytest test suite using uv"
	@echo "  make lint       - Run static analysis and code checks"
	@echo "  make clean      - Remove build artifacts and temporary files"

ensure-uv:
	@if ! command -v uv >/dev/null 2>&1 && [ ! -f $(UV) ]; then \
		echo "uv not found. Installing uv..."; \
		curl -LsSf https://astral.sh/uv/install.sh | sh || pip install uv; \
	fi

install: ensure-uv
	$(UV) venv $(VENV) --python 3.13 --clear
	@if [ -d "../wormcat3" ]; then \
		echo "Installing with local editable ../wormcat3..."; \
		$(UV) pip install --python $(VENV) -e . -e ../wormcat3; \
	else \
		echo "Installing with published wormcat3 package..."; \
		$(UV) pip install --python $(VENV) -e .; \
	fi
	@echo "Installing frontend node dependencies..."
	npm --prefix frontend install

build:
	@echo "Building frontend production static assets..."
	npm --prefix frontend run build

start-dev:
	./sys_ctrl.sh start dev

start-prod: build
	./sys_ctrl.sh start prod

stop:
	./sys_ctrl.sh stop

status:
	./sys_ctrl.sh status

test: ensure-uv
	$(UV) run --python $(VENV) pytest

lint: ensure-uv
	$(UV) run --python $(VENV) ruff check . || true

clean:
	rm -rf .pytest_cache .uv *.egg-info frontend/build
	find . -type d -name "__pycache__" -exec rm -rf {} +


