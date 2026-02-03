#!/bin/bash

# Pre-commit Test Hook
# Runs quick test suite before allowing commit

set -e

echo "Running pre-commit tests..."

# Run backend unit tests (fast)
npm run test:unit

# Run frontend smoke tests (fast)
cd frontend
npm test -- --run
cd ..

echo "✓ All pre-commit tests passed"
