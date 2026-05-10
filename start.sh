#!/bin/bash

# Rephrame React Dashboard Startup Script

echo "🚀 Starting Rephrame React Dashboard..."
echo ""

# Change to the project directory
cd "/Users/allen/Desktop/Epic Structural/rephrame-react-dashboard"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed!"
    echo ""
fi

echo "🔧 Starting development server..."
echo "🌐 The application will open at: http://localhost:3000"
echo ""
echo "🎯 Features available:"
echo "   • Interactive parameter controls"
echo "   • Real-time chart updates"
echo "   • Performance analysis"
echo "   • Export functionality"
echo ""
echo "📱 The dashboard is fully responsive and optimized for all devices."
echo ""

# Start the development server
npm start
