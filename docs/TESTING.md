# Test Coverage Report

## Overview

This project maintains comprehensive test coverage across backend and frontend components.

## Coverage Goals

- **Backend**: 70% minimum coverage
- **Frontend**: 65% minimum coverage
- **Critical paths**: 90% minimum coverage

## Running Tests

### Backend Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Coverage Reports

Coverage reports are generated in the following locations:

- **Backend**: `./coverage/` (HTML report at `./coverage/lcov-report/index.html`)
- **Frontend**: `./frontend/coverage/` (HTML report at `./frontend/coverage/index.html`)

## Test Types

### Unit Tests

- Location: `src/**/__tests__/*.test.js`
- Purpose: Test individual functions and modules in isolation
- Examples:
  - Authentication middleware
  - Authorization middleware
  - Controller functions

### Integration Tests

- Location: `src/__tests__/integration/*.test.js`
- Purpose: Test complete API workflows
- Examples:
  - Craft recognition flow
  - Marketplace operations
  - User authentication flow

### Smoke Tests

- Location: `frontend/src/__tests__/*.smoke.test.jsx`
- Purpose: Verify critical user paths work without errors
- Examples:
  - App initialization
  - Dashboard rendering
  - Marketplace browsing

## Coverage Thresholds

### Backend (Jest)

```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```

### Frontend (Vitest)

Coverage is tracked but not enforced with thresholds in development phase.

## CI/CD Integration

Test coverage is checked in the CI/CD pipeline:

1. All tests must pass
2. Coverage must meet minimum thresholds
3. Coverage reports are uploaded to coverage service

## Writing New Tests

### Backend Test Template

```javascript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should handle expected behavior', () => {
    // Test implementation
  });
});
```

### Frontend Test Template

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ComponentName', () => {
  it('should render without crashing', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeTruthy();
  });
});
```

## Mocking Guidelines

### Backend

- Use `jest.mock()` for external dependencies
- Mock database calls in unit tests
- Use test database for integration tests

### Frontend

- Mock API calls with `vi.fn()`
- Mock complex dependencies
- Use `@testing-library/react` for DOM testing

## Best Practices

1. **Test behavior, not implementation**
2. **Keep tests simple and focused**
3. **Use descriptive test names**
4. **Avoid test interdependencies**
5. **Mock external services**
6. **Test error cases**
7. **Maintain test data fixtures**

## Continuous Improvement

Coverage goals should be reviewed quarterly and adjusted based on:

- Code complexity
- Critical path importance
- Historical bug patterns
- Team capacity

## Excluded from Coverage

The following are intentionally excluded:

- Configuration files
- Build scripts
- Test files themselves
- Migration scripts
- Development utilities
