#!/bin/bash

# Test Coverage Script
# Runs all tests and generates comprehensive coverage reports

set -e

echo "======================================"
echo "Running Test Suite with Coverage"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend Tests
echo -e "${BLUE}Running Backend Tests...${NC}"
echo "--------------------------------------"
npm run test:coverage

echo ""
echo -e "${GREEN}✓ Backend tests completed${NC}"
echo ""

# Frontend Tests
echo -e "${BLUE}Running Frontend Tests...${NC}"
echo "--------------------------------------"
cd frontend
npm run test:coverage
cd ..

echo ""
echo -e "${GREEN}✓ Frontend tests completed${NC}"
echo ""

# Summary
echo "======================================"
echo -e "${GREEN}Test Suite Complete!${NC}"
echo "======================================"
echo ""
echo "Coverage Reports:"
echo "  Backend:  ./coverage/lcov-report/index.html"
echo "  Frontend: ./frontend/coverage/index.html"
echo ""
echo -e "${YELLOW}Tip: Open coverage reports in your browser to view detailed results${NC}"
