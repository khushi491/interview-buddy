#!/bin/bash

echo "Starting MongoDB with Docker..."
echo "Database will be accessible at: mongodb://localhost:27017/interview-buddy"

# Check if MongoDB container is already running
if docker ps | grep -q "mongodb"; then
    echo "MongoDB is already running!"
    exit 0
fi

# Start MongoDB container
docker run -d \
    --name mongodb-interview-buddy \
    -p 27017:27017 \
    -e MONGO_INITDB_DATABASE=interview-buddy \
    -v mongodb_data:/data/db \
    mongo:latest

echo "MongoDB started successfully!"
echo "To stop MongoDB, run: docker stop mongodb-interview-buddy"
echo "To remove MongoDB container, run: docker rm mongodb-interview-buddy"
echo ""
echo "You can now start your Next.js app with: pnpm dev"
