.PHONY: dev frontend backend install test lint docker-build docker-up clean help

help:
	@echo "Cutpoint Development Commands:"
	@echo "  make dev          - Run both frontend and backend concurrently"
	@echo "  make frontend     - Run Next.js frontend (localhost:3000)"
	@echo "  make backend      - Run FastAPI backend (localhost:8000)"
	@echo "  make install      - Install both frontend and backend dependencies"
	@echo "  make test         - Run backend and frontend tests"
	@echo "  make lint         - Run linters on both codebases"
	@echo "  make docker-build - Build Docker images"
	@echo "  make docker-up    - Run stack via Docker Compose"
	@echo "  make clean        - Remove caches and build artifacts"

# Run both services concurrently
dev:
	@echo "Starting Cutpoint development stack..."
	@make -j 2 backend frontend

frontend:
	cd frontend && npm run dev

backend:
	cd backend && uv run uvicorn src.main:app --reload --port 8000 --host 0.0.0.0

install:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installing backend dependencies..."
	cd backend && uv sync

test:
	@echo "Testing backend..."
	cd backend && uv run pytest
	@echo "Testing frontend..."
	cd frontend && npm run test --if-present

lint:
	@echo "Linting backend..."
	cd backend && uv run ruff check .
	@echo "Linting frontend..."
	cd frontend && npm run lint

docker-build:
	docker compose build

docker-up:
	docker compose up

clean:
	rm -rf frontend/node_modules
	rm -rf frontend/.next
	rm -rf backend/.venv
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".ruff_cache" -exec rm -rf {} +
