#!/usr/bin/env bash
set -euo pipefail
set -m # job control so background jobs get their own process groups

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ ! -d node_modules ]]; then
  echo "Dependencies not installed. Run: npm install"
  exit 1
fi

PIDS=()

cleanup() {
  echo ""
  echo "Stopping services..."
  for pid in "${PIDS[@]}"; do
    kill -- "-$pid" 2>/dev/null || kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}

trap cleanup EXIT INT TERM

echo "Starting Astro blog dev server..."
npm run dev &
PIDS+=($!)

echo "Starting blog writer..."
npm run writer &
PIDS+=($!)

echo ""
echo "Blog:   http://localhost:4321"
echo "Writer: http://localhost:5174"
echo ""
echo "Press Ctrl+C to stop both."
echo ""

wait
