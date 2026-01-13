#!/bin/sh
set -e

echo "[Start] Waiting for database..."
node scripts/wait-for-db.js

echo "[Start] Running migrations..."
npx prisma migrate deploy || echo "[Start] Migration warning - continuing anyway"

echo "[Start] Starting application..."
exec node dist/src/main
