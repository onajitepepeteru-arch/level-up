#!/bin/bash

echo "Starting LevelUp App..."

echo "Starting Backend Server..."
cd backend
python server_new.py &
BACKEND_PID=$!

echo "Backend started with PID: $BACKEND_PID"

cd ..

echo "Starting Frontend..."
cd frontend
yarn start &
FRONTEND_PID=$!

echo "Frontend started with PID: $FRONTEND_PID"

echo ""
echo "LevelUp App is running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"

wait
