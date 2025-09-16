#!/bin/bash

echo "Starting RobBridge Servers..."
echo

echo "Starting Python Backend..."
cd "../Barcode generator&Scanner"
python start_server.py &
PYTHON_PID=$!

echo "Waiting for Python backend to start..."
sleep 5

echo "Starting Node.js Server..."
cd "../Robridge web"
node server.js &
NODE_PID=$!

echo
echo "Both servers are starting..."
echo "Python Backend: http://localhost:5000"
echo "Node.js Server: http://localhost:3001"
echo

echo "Press any key to test backend connection..."
read -n 1

echo "Testing backend connection..."
node test-backend.js

echo
echo "Press any key to exit..."
read -n 1

# Clean up processes
kill $PYTHON_PID 2>/dev/null
kill $NODE_PID 2>/dev/null
