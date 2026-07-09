#!/bin/bash

echo "🚀 Starting AURA..."

# Start backend in background
echo "Starting backend..."
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend in background
echo "Starting frontend..."
cd ../frontend/aura-ui
npm start &
FRONTEND_PID=$!

echo "✅ AURA is starting!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
