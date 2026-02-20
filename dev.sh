#!/bin/bash
# Start both frontend (Vite) and backend (Flask) together.
# Usage: ./dev.sh

trap 'kill 0' EXIT

echo "Starting backend (Flask :3001)..."
cd server && python app.py &

echo "Starting frontend (Vite :5173)..."
cd "$(dirname "$0")" && npm run dev &

wait
