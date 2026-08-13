.PHONY: help install dev stop status test lint clean ensure-uv

export PATH := $(HOME)/.local/bin:$(HOME)/.cargo/bin:$(PATH)

VENV := .venv
PYTHON := $(VENV)/bin/python
UV := $(shell command -v uv 2>/dev/null || echo "$(HOME)/.local/bin/uv")

help:
	@echo "Available commands:"
	@echo "  make install  - Create .venv and install all dependencies via uv"
	@echo "  make dev      - Start local development services (Prefect, API, React)"
	@echo "  make stop     - Stop all running services"
	@echo "  make status   - Check status of running services"
	@echo "  make test     - Run pytest test suite using uv"
	@echo "  make lint     - Run static analysis and code checks"
	@echo "  make clean    - Remove build artifacts and temporary files"

ensure-uv:
	@if ! command -v uv >/dev/null 2>&1 && [ ! -f $(UV) ]; then \
		echo "uv not found. Installing uv..."; \
		curl -LsSf https://astral.sh/uv/install.sh | sh || pip install uv; \
	fi

install: ensure-uv
	$(UV) venv $(VENV) --python 3.13 --clear
	$(UV) pip install --python $(VENV) -e . -e ../wormcat3

dev:
	./sys_ctrl.sh start

stop:
	./sys_ctrl.sh stop

status:
	./sys_ctrl.sh status

test: ensure-uv
	$(UV) run --python $(VENV) pytest

lint: ensure-uv
	$(UV) run --python $(VENV) ruff check . || true

clean:
	rm -rf .pytest_cache .uv *.egg-info
	find . -type d -name "__pycache__" -exec rm -rf {} +

