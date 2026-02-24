#!/bin/bash

# Opensite Quick Start Script
# CTL Plumbing Intelligence Platform

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         Opensite - CTL Plumbing Intelligence Platform      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
echo "🔍 Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi
NODE_VERSION=$(node -v)
echo "✅ Node.js $NODE_VERSION detected"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi
echo "✅ npm detected"

# Check Ollama
echo ""
echo "🔍 Checking Ollama installation..."
if ! command -v ollama &> /dev/null; then
    echo "⚠️  Ollama is not installed. AI features will not work."
    echo "   Install from: https://ollama.ai"
else
    echo "✅ Ollama detected"

    # Check if Ollama is running
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "✅ Ollama is running"

        # Check for llama3.1 model
        if ollama list | grep -q "llama3.1"; then
            echo "✅ llama3.1 model is available"
        else
            echo "⚠️  llama3.1 model not found"
            echo "   Pulling llama3.1 model (this may take a few minutes)..."
            ollama pull llama3.1
        fi
    else
        echo "⚠️  Ollama is not running. Starting Ollama..."
        echo "   Run: ollama serve"
    fi
fi

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Backend dependencies already installed"
fi

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Frontend dependencies already installed"
fi

cd ..

# Create .env if not exists
if [ ! -f "backend/.env" ]; then
    echo ""
    echo "📝 Creating backend .env file..."
    cp backend/.env.example backend/.env
    echo "✅ Backend .env created"
fi

# Start services
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                    Starting Services                      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Start backend
echo "🚀 Starting backend server..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:5001/api/health > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo "⚠️  Backend took too long to start. Check backend.log for errors."
    fi
done

# Start frontend
cd ../frontend
echo "🚀 Starting frontend server..."
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

# Save PIDs
cd ..
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                  🎉 Opensite is Running! 🎉                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Frontend:  http://localhost:3000"
echo "🔧 Backend:   http://localhost:5001"
echo "🤖 AI Model:  llama3.1 via Ollama"
echo "👁️  CV Service: AECVision (start with: ./start-aecvision.sh)"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop:"
echo "   kill \$(cat .backend.pid .frontend.pid)"
echo ""
echo "Press Ctrl+C to view logs (services will continue running)"
echo ""

# Follow logs
tail -f backend.log frontend.log
