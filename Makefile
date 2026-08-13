.PHONY: help install dev stop status test lint clean

VENV := .venv
PYTHON := $(VENV)/bin/python
UV := uv

help:
	@echo "Available commands:"
	@echo "  make install  - Create .venv and install all dependencies via uv"
	@echo "  make dev      - Start local development services (Prefect, API, React)"
	@echo "  make stop     - Stop all running services"
	@echo "  make status   - Check status of running services"
	@echo "  make test     - Run pytest test suite using uv"
	@echo "  make lint     - Run static analysis and code checks"
	@echo "  make clean    - Remove build artifacts and temporary files"

install:
	$(UV) venv $(VENV) --python 3.13 --clear
	$(UV) pip install --python $(VENV) -e . -e ../wormcat3

dev:
	./sys_ctrl.sh start

stop:
	./sys_ctrl.sh stop

status:
	./sys_ctrl.sh status

test:
	$(UV) run --python $(VENV) pytest

lint:
	$(UV) run --python $(VENV) ruff check . || true

clean:
	rm -rf .pytest_cache .uv *.egg-info
	find . -type d -name "__pycache__" -exec rm -rf {} +
